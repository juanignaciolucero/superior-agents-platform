// MCP Configuration Manager
// Handles validation, storage, and management of MCP configurations

const { getMCPById } = require('./mcpCatalog');
const fs = require('fs').promises;
const path = require('path');

class MCPConfigManager {
  constructor() {
    this.configDir = path.join(__dirname, 'agent-configs');
    this.ensureConfigDir();
  }

  async ensureConfigDir() {
    try {
      await fs.access(this.configDir);
    } catch {
      await fs.mkdir(this.configDir, { recursive: true });
    }
  }

  // Get configuration requirements for an MCP
  getMCPConfigRequirements(mcpId) {
    const mcp = getMCPById(mcpId);
    if (!mcp || !mcp.config) {
      return null;
    }

    const requirements = {
      mcpId,
      name: mcp.name,
      description: mcp.description,
      icon: mcp.icon,
      fields: mcp.config.configFields || [],
      requiredEnvVars: mcp.config.requiredEnvVars || [],
      optionalEnvVars: mcp.config.optionalEnvVars || [],
      hasRequiredFields: (mcp.config.configFields || []).some(field => field.required)
    };

    return requirements;
  }

  // Get configuration requirements for multiple MCPs
  getMCPsConfigRequirements(mcpIds) {
    const requirements = mcpIds
      .map(id => this.getMCPConfigRequirements(id))
      .filter(Boolean);

    const summary = {
      mcps: requirements,
      totalFields: requirements.reduce((sum, req) => sum + req.fields.length, 0),
      requiredFields: requirements.reduce((sum, req) => 
        sum + req.fields.filter(field => field.required).length, 0),
      hasRequiredConfigs: requirements.some(req => req.hasRequiredFields)
    };

    return summary;
  }

  // Validate configuration values for an MCP
  validateMCPConfig(mcpId, configValues) {
    console.log(`🔍 validateMCPConfig called for ${mcpId} with:`, configValues);
    
    const requirements = this.getMCPConfigRequirements(mcpId);
    if (!requirements) {
      console.log(`❌ MCP requirements not found for ${mcpId}`);
      return { valid: false, error: 'MCP not found' };
    }

    console.log(`📋 Found requirements for ${mcpId}:`, {
      fieldsCount: requirements.fields.length,
      fieldKeys: requirements.fields.map(f => f.key)
    });

    const errors = [];
    const warnings = [];

    // Validate each field
    for (const field of requirements.fields) {
      const value = configValues[field.key];
      console.log(`  🔸 Validating field ${field.key} (${field.type}, required: ${field.required}):`, value);

      // Check if value is empty (handling both strings and numbers)
      const isEmpty = !value || 
                      value === '' || 
                      (typeof value === 'string' && value.trim() === '') ||
                      value === null ||
                      value === undefined;

      // Check required fields
      if (field.required && isEmpty) {
        console.log(`    ❌ Required field ${field.key} is missing or empty`);
        errors.push(`${field.label} is required`);
        continue;
      }

      // Skip validation if field is optional and empty
      if (!field.required && isEmpty) {
        console.log(`    ⏭️ Skipping optional empty field ${field.key}`);
        continue;
      }

      console.log(`    ✅ Field ${field.key} has value, proceeding with validation...`);

      // Type validation
      if (field.type === 'number') {
        if (isNaN(Number(value))) {
          errors.push(`${field.label} must be a valid number`);
        }
      }

      if (field.type === 'url') {
        try {
          new URL(value);
        } catch {
          errors.push(`${field.label} must be a valid URL`);
        }
      }

      // Specific field validations (instead of regex which doesn't serialize well)
      if (field.key === 'COINGECKO_API_KEY') {
        if (value.length < 10) {
          errors.push(`${field.label} must be at least 10 characters long`);
        }
      }
      
      if (field.key === 'ETH_RPC_URL' || field.key === 'SOL_RPC_URL') {
        if (!value.match(/^https?:\/\/.+/)) {
          errors.push(`${field.label} must be a valid HTTP or HTTPS URL`);
        }
      }
      
      if (field.key === 'UPDATE_INTERVAL') {
        if (!value.toString().match(/^\d+$/)) {
          errors.push(`${field.label} must be a valid number`);
        }
      }

      // Special validations
      if (field.key === 'WALLET_ADDRESSES') {
        const addresses = value.split(',').map(addr => addr.trim());
        const invalidAddresses = addresses.filter(addr => 
          !addr.match(/^0x[a-fA-F0-9]{40}$/)
        );
        if (invalidAddresses.length > 0) {
          errors.push(`Invalid Ethereum wallet addresses: ${invalidAddresses.join(', ')}`);
        }
      }

      if (field.key === 'SOL_WALLET_ADDRESSES') {
        const addresses = value.split(',').map(addr => addr.trim());
        const invalidAddresses = addresses.filter(addr => 
          !addr.match(/^[A-HJ-NP-Za-km-z1-9]{32,44}$/)
        );
        if (invalidAddresses.length > 0) {
          errors.push(`Invalid Solana wallet addresses: ${invalidAddresses.join(', ')}`);
        }
      }
    }

    // Cross-field validations
    if (requirements.mcpId === 'wallet-tracker') {
      const hasSolWallets = configValues['SOL_WALLET_ADDRESSES'] && configValues['SOL_WALLET_ADDRESSES'].trim();
      const hasSolRpc = configValues['SOL_RPC_URL'] && configValues['SOL_RPC_URL'].trim();
      
      if (hasSolWallets && !hasSolRpc) {
        errors.push('Solana RPC URL is required when monitoring Solana wallet addresses');
      }
      
      if (hasSolRpc && !hasSolWallets) {
        warnings.push('Solana RPC URL provided but no Solana wallet addresses to monitor');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      configuredFields: Object.keys(configValues).length,
      requiredFields: requirements.fields.filter(f => f.required).length
    };
  }

  // Validate configurations for multiple MCPs
  validateMCPsConfig(mcpConfigs) {
    const results = {};
    let allValid = true;
    let totalErrors = 0;

    for (const [mcpId, configValues] of Object.entries(mcpConfigs)) {
      const validation = this.validateMCPConfig(mcpId, configValues);
      results[mcpId] = validation;
      
      if (!validation.valid) {
        allValid = false;
        totalErrors += validation.errors.length;
      }
    }

    return {
      valid: allValid,
      results,
      totalErrors,
      summary: {
        validMCPs: Object.values(results).filter(r => r.valid).length,
        invalidMCPs: Object.values(results).filter(r => !r.valid).length,
        totalMCPs: Object.keys(results).length
      }
    };
  }

  // Save MCP configuration for an agent
  async saveAgentMCPConfig(agentId, mcpConfigs) {
    const configPath = path.join(this.configDir, `${agentId}-mcp-config.json`);
    
    const configData = {
      agentId,
      mcpConfigs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
      console.log(`✅ MCP configuration saved for agent ${agentId}`);
      return { success: true, path: configPath };
    } catch (error) {
      console.error(`❌ Failed to save MCP config for agent ${agentId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Load MCP configuration for an agent
  async loadAgentMCPConfig(agentId) {
    const configPath = path.join(this.configDir, `${agentId}-mcp-config.json`);
    
    try {
      const data = await fs.readFile(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // Config doesn't exist
      }
      throw error;
    }
  }

  // Generate environment variables from MCP configurations
  generateEnvVars(mcpConfigs) {
    const envVars = {};
    
    for (const [mcpId, configValues] of Object.entries(mcpConfigs)) {
      const requirements = this.getMCPConfigRequirements(mcpId);
      if (!requirements) continue;

      // Add prefix to avoid conflicts
      const prefix = mcpId.toUpperCase().replace(/-/g, '_') + '_';
      
      for (const [key, value] of Object.entries(configValues)) {
        if (value && value.trim() !== '') {
          envVars[`${prefix}${key}`] = value;
        }
      }
    }

    return envVars;
  }

  // Check if agent has required configurations for deployment
  async checkDeploymentReadiness(agentId, selectedMCPs) {
    const requirements = this.getMCPsConfigRequirements(selectedMCPs);
    
    if (!requirements.hasRequiredConfigs) {
      return { ready: true, message: 'No configuration required' };
    }

    const savedConfig = await this.loadAgentMCPConfig(agentId);
    if (!savedConfig) {
      return { 
        ready: false, 
        message: 'MCP configuration required',
        missingConfigs: requirements.mcps.filter(mcp => mcp.hasRequiredFields)
      };
    }

    const validation = this.validateMCPsConfig(savedConfig.mcpConfigs);
    if (!validation.valid) {
      return {
        ready: false,
        message: 'Invalid MCP configuration',
        errors: validation.results
      };
    }

    return { 
      ready: true, 
      message: 'All configurations valid',
      configuredMCPs: Object.keys(savedConfig.mcpConfigs).length
    };
  }

  // Get configuration status summary
  getConfigStatus(mcpIds, mcpConfigs = {}) {
    const requirements = this.getMCPsConfigRequirements(mcpIds);
    const configured = Object.keys(mcpConfigs).length;
    const needsConfig = requirements.mcps.filter(mcp => mcp.hasRequiredFields).length;
    
    return {
      totalMCPs: mcpIds.length,
      configuredMCPs: configured,
      needsConfigMCPs: needsConfig,
      configurationComplete: configured >= needsConfig,
      readyForDeployment: configured >= needsConfig && 
        this.validateMCPsConfig(mcpConfigs).valid
    };
  }
}

const mcpConfigManager = new MCPConfigManager();

module.exports = {
  MCPConfigManager,
  mcpConfigManager
};