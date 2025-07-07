const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const path = require('path');
const { 
  MCP_CATALOG, 
  getMCPsByCategory, 
  getMCPById, 
  getAvailableCategories,
  generateMCPToolsDescription 
} = require('./mcpCatalog');
const { recommendationEngine } = require('./mcpRecommendations');
const { llmRecommendationEngine } = require('./llmMcpRecommendations');
const { llmPromptEnhancer } = require('./llmPromptEnhancer');
const { mcpConfigManager } = require('./mcpConfigManager');
const DeploymentManager = require('./deploymentManager');
require('dotenv').config();

// Initialize deployment manager
const deploymentManager = new DeploymentManager();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Persistent storage for agents
const agents = new Map();
const agentsDbPath = path.join(__dirname, 'agents-db.json');

// Load agents from persistence on startup
async function loadAgents() {
  try {
    const data = await fs.readFile(agentsDbPath, 'utf8');
    const agentsData = JSON.parse(data);
    console.log(`📂 Loading ${agentsData.length} agents from persistence`);
    
    agentsData.forEach(agent => {
      agents.set(agent.id, agent);
    });
    
    console.log(`✅ Loaded ${agents.size} agents from ${agentsDbPath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📂 No agents database found, starting fresh');
    } else {
      console.error('❌ Error loading agents:', error);
    }
  }
}

// Save agents to persistence
async function saveAgents() {
  try {
    const agentsData = Array.from(agents.values());
    await fs.writeFile(agentsDbPath, JSON.stringify(agentsData, null, 2));
    console.log(`💾 Saved ${agentsData.length} agents to persistence`);
  } catch (error) {
    console.error('❌ Error saving agents:', error);
  }
}

// Auto-save agents every 30 seconds
setInterval(saveAgents, 30000);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all agents
app.get('/api/agents', (req, res) => {
  const agentList = Array.from(agents.values());
  console.log(`📋 LISTING ${agentList.length} AGENTS:`);
  agentList.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent.name} (${agent.status}) - ID: ${agent.id}`);
  });
  res.json({ agents: agentList });
});

// Get configurations in readable format
app.get('/api/configurations', (req, res) => {
  const agentList = Array.from(agents.values());
  console.log('📄 CONFIGURATIONS REQUESTED - Displaying all agent configs');
  
  const configurations = agentList.map(agent => ({
    id: agent.id,
    name: agent.name,
    status: agent.status,
    createdAt: agent.createdAt,
    frontendConfig: {
      name: agent.name,
      description: agent.description,
      prompt: agent.prompt,
      llm: agent.llm,
      sensors: agent.sensors,
      rag: agent.rag
    },
    superiorAgentsConfig: agent.superiorAgentConfig
  }));

  res.json({
    total: configurations.length,
    configurations
  });
});

// Get all available MCPs
app.get('/api/mcps', (req, res) => {
  console.log('📋 MCP CATALOG REQUESTED');
  
  const { category } = req.query;
  
  let mcps = category ? getMCPsByCategory(category) : MCP_CATALOG;
  
  console.log(`📦 Returning ${mcps.length} MCPs${category ? ` in category '${category}'` : ''}`);
  
  res.json({
    total: mcps.length,
    categories: getAvailableCategories(),
    mcps: mcps
  });
});

// Get MCP by ID
app.get('/api/mcps/:id', (req, res) => {
  const mcp = getMCPById(req.params.id);
  
  if (!mcp) {
    console.log(`❌ MCP not found: ${req.params.id}`);
    return res.status(404).json({ error: 'MCP not found' });
  }
  
  console.log(`📦 MCP details requested: ${mcp.name}`);
  res.json({ mcp });
});

// Enhance agent prompt using LLM
app.post('/api/prompts/enhance', async (req, res) => {
  try {
    console.log('✨ PROMPT ENHANCEMENT REQUEST');
    
    const { 
      prompt = '', 
      agentName = '', 
      agentDescription = '', 
      selectedMCPs = [] 
    } = req.body;
    
    console.log('📋 ENHANCING PROMPT:');
    console.log(`  - Agent: ${agentName}`);
    console.log(`  - Description: ${agentDescription}`);
    console.log(`  - Original Prompt Length: ${prompt.length} characters`);
    console.log(`  - Selected MCPs: [${selectedMCPs.map(mcp => mcp.id || mcp).join(', ')}]`);
    
    // Validate input
    if (!prompt || prompt.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Prompt must be at least 10 characters long' 
      });
    }
    
    // Get MCP details for context
    const mcpDetails = selectedMCPs.map(mcpId => {
      const id = typeof mcpId === 'string' ? mcpId : mcpId.id;
      return getMCPById(id);
    }).filter(Boolean);
    
    // Try LLM-based enhancement first, fallback to rule-based
    let enhancement;
    let usedLLM = false;
    
    const enhancerStatus = llmPromptEnhancer.getStatus();
    console.log('🔍 LLM Enhancer Status:', enhancerStatus);
    
    if (llmPromptEnhancer.isAvailable()) {
      console.log(`🤖 Using LLM-based prompt enhancement with ${enhancerStatus.provider}...`);
      try {
        enhancement = await llmPromptEnhancer.enhancePrompt(
          prompt, 
          agentName, 
          agentDescription, 
          mcpDetails
        );
        usedLLM = true;
        console.log('✅ LLM enhancement completed successfully');
      } catch (error) {
        console.log('❌ LLM enhancement failed, falling back to rule-based system:', error.message);
        enhancement = llmPromptEnhancer.enhancePromptRuleBased(
          prompt, 
          agentName, 
          agentDescription, 
          mcpDetails
        );
      }
    } else {
      console.log('🔧 Using rule-based prompt enhancement (LLM not available)');
      enhancement = llmPromptEnhancer.enhancePromptRuleBased(
        prompt, 
        agentName, 
        agentDescription, 
        mcpDetails
      );
    }
    
    console.log('✨ ENHANCEMENT RESULTS:');
    console.log(`  - Enhanced Prompt Length: ${enhancement.enhancedPrompt.length} characters`);
    console.log(`  - Improvement Ratio: ${(enhancement.enhancedPrompt.length / prompt.length).toFixed(1)}x`);
    console.log(`  - Techniques Applied: ${enhancement.techniques.length}`);
    console.log(`  - Confidence: ${Math.round(enhancement.confidence * 100)}%`);
    
    res.json({
      original: {
        prompt,
        length: prompt.length
      },
      enhanced: {
        prompt: enhancement.enhancedPrompt,
        length: enhancement.enhancedPrompt.length,
        improvementRatio: Math.round((enhancement.enhancedPrompt.length / prompt.length) * 10) / 10
      },
      analysis: {
        improvements: enhancement.improvements,
        techniques: enhancement.techniques,
        confidence: enhancement.confidence,
        method: usedLLM ? 'llm' : enhancement.method || 'rules'
      },
      context: {
        agentName,
        agentDescription,
        mcpsCount: mcpDetails.length,
        mcpsUsed: mcpDetails.map(mcp => mcp.name)
      },
      enhancerStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR enhancing prompt:', error);
    res.status(500).json({ 
      error: 'Failed to enhance prompt',
      details: error.message 
    });
  }
});

// Analyze agent prompt and recommend MCPs
app.post('/api/mcps/analyze', async (req, res) => {
  try {
    console.log('🧠 MCP RECOMMENDATION REQUEST');
    
    const { name = '', description = '', prompt = '' } = req.body;
    
    console.log('📋 ANALYZING AGENT PURPOSE:');
    console.log(`  - Name: ${name}`);
    console.log(`  - Description: ${description}`);
    console.log(`  - Prompt Length: ${prompt.length} characters`);
    
    // Validate input
    if (!name && !description && !prompt) {
      return res.status(400).json({ 
        error: 'At least one field (name, description, prompt) is required' 
      });
    }
    
    // Try LLM-based analysis first, fallback to rule-based
    let analysis;
    let usedLLM = false;
    
    const llmStatus = llmRecommendationEngine.getStatus();
    console.log('🔍 LLM Status:', llmStatus);
    
    if (llmRecommendationEngine.isAvailable()) {
      console.log(`🤖 Using LLM-based analysis with ${llmStatus.provider}...`);
      try {
        analysis = await llmRecommendationEngine.analyzePurpose(name, description, prompt);
        usedLLM = true;
        console.log('✅ LLM analysis completed successfully');
      } catch (error) {
        console.log('❌ LLM analysis failed, falling back to rule-based system:', error.message);
        analysis = recommendationEngine.analyzePurpose(name, description, prompt);
      }
    } else {
      console.log('🔧 Using rule-based analysis (LLM not available)');
      if (process.env.OPENAI_API_KEY) {
        console.log(`   OPENAI_API_KEY starts with: ${process.env.OPENAI_API_KEY.substring(0, 5)}...`);
        console.log(`   Key length: ${process.env.OPENAI_API_KEY.length}`);
      } else {
        console.log('   No OPENAI_API_KEY found');
      }
      analysis = recommendationEngine.analyzePurpose(name, description, prompt);
    }
    
    console.log('🎯 ANALYSIS RESULTS:');
    console.log(`  - Detected Use Cases: ${analysis.detectedUseCases.length}`);
    console.log(`  - Suggested MCPs: ${analysis.suggestedMCPs.length}`);
    console.log(`  - Overall Confidence: ${Math.round(analysis.confidence * 100)}%`);
    
    if (analysis.suggestedMCPs.length > 0) {
      console.log('💡 TOP SUGGESTIONS:');
      analysis.suggestedMCPs.slice(0, 3).forEach((mcp, index) => {
        console.log(`  ${index + 1}. ${mcp.name} (${Math.round(mcp.confidence * 100)}% confidence)`);
        console.log(`     Reason: ${mcp.reason}`);
      });
    }
    
    // Get all MCPs with recommendation status
    const allMCPs = getMCPsByCategory(); // Get all available MCPs
    const suggestedIds = new Set(analysis.suggestedMCPs.map(mcp => mcp.id));
    
    const mcpsWithRecommendations = allMCPs.map(mcp => {
      const suggestion = analysis.suggestedMCPs.find(s => s.id === mcp.id);
      return {
        ...mcp,
        suggested: suggestedIds.has(mcp.id),
        confidence: suggestion?.confidence || 0,
        reason: suggestion?.reason || null,
        priority: suggestion ? (suggestion.confidence > 0.7 ? 'high' : 'medium') : 'low'
      };
    });
    
    res.json({
      analysis: {
        detectedUseCases: analysis.detectedUseCases,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        method: usedLLM ? 'llm' : 'rules',
        llmStatus: llmRecommendationEngine.getStatus()
      },
      recommendations: {
        suggested: analysis.suggestedMCPs,
        all: mcpsWithRecommendations
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR analyzing MCPs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get MCP configuration requirements
app.get('/api/mcps/:id/config', (req, res) => {
  try {
    const mcpId = req.params.id;
    console.log(`🔧 MCP CONFIG REQUIREMENTS REQUEST: ${mcpId}`);
    
    const requirements = mcpConfigManager.getMCPConfigRequirements(mcpId);
    if (!requirements) {
      return res.status(404).json({ error: 'MCP not found' });
    }
    
    console.log(`📋 Config requirements for ${requirements.name}:`);
    console.log(`  - Fields: ${requirements.fields.length}`);
    console.log(`  - Required fields: ${requirements.fields.filter(f => f.required).length}`);
    console.log(`  - Has required configs: ${requirements.hasRequiredFields}`);
    
    res.json({ requirements });
  } catch (error) {
    console.error('❌ ERROR getting MCP config requirements:', error);
    res.status(500).json({ error: 'Failed to get config requirements' });
  }
});

// Get configuration requirements for multiple MCPs
app.post('/api/mcps/config-requirements', (req, res) => {
  try {
    const { mcpIds = [] } = req.body;
    console.log(`🔧 BULK MCP CONFIG REQUIREMENTS REQUEST: [${mcpIds.join(', ')}]`);
    
    const requirements = mcpConfigManager.getMCPsConfigRequirements(mcpIds);
    
    console.log(`📋 Bulk config requirements summary:`);
    console.log(`  - Total MCPs: ${requirements.mcps.length}`);
    console.log(`  - Total fields: ${requirements.totalFields}`);
    console.log(`  - Required fields: ${requirements.requiredFields}`);
    console.log(`  - Has required configs: ${requirements.hasRequiredConfigs}`);
    
    res.json({ requirements });
  } catch (error) {
    console.error('❌ ERROR getting bulk MCP config requirements:', error);
    res.status(500).json({ error: 'Failed to get config requirements' });
  }
});

// Validate MCP configuration
app.post('/api/mcps/:id/validate-config', (req, res) => {
  try {
    const mcpId = req.params.id;
    const { configValues = {} } = req.body;
    
    console.log(`✅ MCP CONFIG VALIDATION REQUEST: ${mcpId}`);
    console.log(`  - Config values provided: ${Object.keys(configValues).length} fields`);
    console.log(`  - Config values:`, configValues);
    
    // Check if MCP exists
    const requirements = mcpConfigManager.getMCPConfigRequirements(mcpId);
    if (!requirements) {
      console.log(`❌ MCP not found: ${mcpId}`);
      return res.status(404).json({ error: 'MCP not found' });
    }
    
    console.log(`📋 Found MCP requirements:`, {
      name: requirements.name,
      fieldsCount: requirements.fields.length,
      hasRequiredFields: requirements.hasRequiredFields
    });
    
    const validation = mcpConfigManager.validateMCPConfig(mcpId, configValues);
    
    console.log(`📊 Validation result:`);
    console.log(`  - Valid: ${validation.valid}`);
    console.log(`  - Errors: ${validation.errors.length}`);
    console.log(`  - Warnings: ${validation.warnings.length}`);
    
    if (!validation.valid) {
      console.log(`❌ Validation errors:`, validation.errors);
    }
    
    if (validation.warnings && validation.warnings.length > 0) {
      console.log(`⚠️ Validation warnings:`, validation.warnings);
    }
    
    res.json({ validation });
  } catch (error) {
    console.error('❌ ERROR validating MCP config:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to validate config',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Save agent MCP configuration
app.post('/api/agents/:id/mcp-config', async (req, res) => {
  try {
    const agentId = req.params.id;
    const { mcpConfigs = {} } = req.body;
    
    console.log(`💾 SAVE AGENT MCP CONFIG: ${agentId}`);
    console.log(`  - MCPs to configure: [${Object.keys(mcpConfigs).join(', ')}]`);
    
    // Validate all configurations
    const validation = mcpConfigManager.validateMCPsConfig(mcpConfigs);
    if (!validation.valid) {
      console.log(`❌ Configuration validation failed:`, validation.results);
      return res.status(400).json({ 
        error: 'Invalid configuration',
        validation: validation.results 
      });
    }
    
    // Save configuration
    const result = await mcpConfigManager.saveAgentMCPConfig(agentId, mcpConfigs);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    console.log(`✅ MCP configuration saved successfully for agent ${agentId}`);
    
    res.json({ 
      success: true,
      validation,
      configPath: result.path
    });
    
  } catch (error) {
    console.error('❌ ERROR saving agent MCP config:', error);
    res.status(500).json({ error: 'Failed to save MCP configuration' });
  }
});

// Get agent MCP configuration
app.get('/api/agents/:id/mcp-config', async (req, res) => {
  try {
    const agentId = req.params.id;
    console.log(`📖 GET AGENT MCP CONFIG: ${agentId}`);
    
    const config = await mcpConfigManager.loadAgentMCPConfig(agentId);
    if (!config) {
      return res.status(404).json({ error: 'No MCP configuration found for this agent' });
    }
    
    console.log(`📋 Found MCP config for agent ${agentId}:`);
    console.log(`  - MCPs configured: [${Object.keys(config.mcpConfigs).join(', ')}]`);
    console.log(`  - Created: ${config.createdAt}`);
    console.log(`  - Updated: ${config.updatedAt}`);
    
    res.json({ config });
    
  } catch (error) {
    console.error('❌ ERROR getting agent MCP config:', error);
    res.status(500).json({ error: 'Failed to get MCP configuration' });
  }
});

// Check deployment readiness
app.get('/api/agents/:id/deployment-readiness', async (req, res) => {
  try {
    const agentId = req.params.id;
    const { mcps = [] } = req.query;
    
    // Parse MCPs from query string
    const selectedMCPs = Array.isArray(mcps) ? mcps : [mcps].filter(Boolean);
    
    console.log(`🚀 DEPLOYMENT READINESS CHECK: ${agentId}`);
    console.log(`  - Selected MCPs: [${selectedMCPs.join(', ')}]`);
    
    const readiness = await mcpConfigManager.checkDeploymentReadiness(agentId, selectedMCPs);
    
    console.log(`📊 Deployment readiness result:`);
    console.log(`  - Ready: ${readiness.ready}`);
    console.log(`  - Message: ${readiness.message}`);
    
    res.json({ readiness });
    
  } catch (error) {
    console.error('❌ ERROR checking deployment readiness:', error);
    res.status(500).json({ error: 'Failed to check deployment readiness' });
  }
});

// Get specific agent
app.get('/api/agents/:id', (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json({ agent });
});

// Create new agent
app.post('/api/agents', async (req, res) => {
  try {
    console.log('🔍 RAW REQUEST FROM FRONTEND:');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('----------------------------------------');

    const { name, description, prompt, llm, mcps, rag } = req.body;

    // Validation
    if (!name || !description || !prompt || !llm || !mcps || !rag) {
      console.log('❌ VALIDATION ERROR - Missing fields');
      return res.status(400).json({ 
        error: 'Missing required fields: name, description, prompt, llm, mcps, rag' 
      });
    }

    // Validate MCPs exist
    const invalidMCPs = mcps.filter(mcpId => !getMCPById(mcpId));
    if (invalidMCPs.length > 0) {
      console.log(`❌ VALIDATION ERROR - Invalid MCPs: ${invalidMCPs.join(', ')}`);
      return res.status(400).json({ 
        error: `Invalid MCP IDs: ${invalidMCPs.join(', ')}` 
      });
    }

    console.log('✅ VALIDATION PASSED');
    console.log('📋 PARSED CONFIGURATION:');
    console.log(`  - Agent Name: ${name}`);
    console.log(`  - Description: ${description}`);
    console.log(`  - Prompt Length: ${prompt.length} characters`);
    console.log(`  - LLM Selected: ${llm}`);
    console.log(`  - MCPs Selected: [${mcps.join(', ')}]`);
    console.log(`  - RAG Type: ${rag}`);

    // Generate unique ID for the agent
    const agentId = uuidv4();
    console.log(`🆔 Generated Agent ID: ${agentId}`);
    
    // Create agent configuration
    const agentConfig = {
      id: agentId,
      name,
      description,
      prompt,
      llm,
      mcps,
      rag,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Generate Superior Agents compatible JSON configuration
    const superiorAgentConfig = generateSuperiorAgentConfig(agentConfig);
    
    console.log('🔧 GENERATED SUPERIOR AGENTS CONFIG:');
    console.log(JSON.stringify(superiorAgentConfig, null, 2));
    console.log('========================================');

    // Store agent configuration
    agents.set(agentId, {
      ...agentConfig,
      superiorAgentConfig
    });

    // Save to persistence
    await saveAgents();

    res.status(201).json({
      message: 'Agent created successfully',
      agentId,
      frontendConfig: req.body,
      superiorAgentsConfig: superiorAgentConfig
    });

  } catch (error) {
    console.error('❌ ERROR creating agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deploy agent (REAL implementation with Docker)
app.post('/api/agents/:id/deploy', async (req, res) => {
  try {
    console.log(`🚀 REAL DEPLOYMENT REQUEST for Agent ID: ${req.params.id}`);
    
    const agent = agents.get(req.params.id);
    if (!agent) {
      console.log('❌ Agent not found for deployment');
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log('📦 AGENT TO DEPLOY:');
    console.log(`  - Name: ${agent.name}`);
    console.log(`  - LLM: ${agent.llm}`);
    console.log(`  - MCPs: [${agent.mcps.join(', ')}]`);
    console.log(`  - Current Status: ${agent.status}`);

    // Update status to deploying
    agent.status = 'deploying';
    agent.updatedAt = new Date().toISOString();
    agents.set(req.params.id, agent);
    await saveAgents();

    // Start deployment process (async)
    deploymentManager.deployAgent(req.params.id, agent.superiorAgentConfig)
      .then(result => {
        if (result.success) {
          agent.status = 'running';
          agent.deployedAt = new Date().toISOString();
          agent.containerUrl = result.url;
          agents.set(req.params.id, agent);
          saveAgents();
          
          console.log(`✅ REAL DEPLOYMENT COMPLETED for ${agent.name}`);
          console.log(`🌐 Container URL: ${result.url}`);
        } else {
          agent.status = 'failed';
          agent.error = result.error;
          agents.set(req.params.id, agent);
          saveAgents();
          
          console.log(`❌ DEPLOYMENT FAILED for ${agent.name}: ${result.error}`);
        }
      })
      .catch(error => {
        agent.status = 'failed';
        agent.error = error.message;
        agents.set(req.params.id, agent);
        saveAgents();
        
        console.log(`❌ DEPLOYMENT ERROR for ${agent.name}: ${error.message}`);
      });

    res.json({
      message: 'Agent deployment started',
      agentId: req.params.id,
      status: 'deploying',
      note: 'Real deployment with Docker containers - check status endpoint for updates'
    });

  } catch (error) {
    console.error('❌ ERROR deploying agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stop agent
app.post('/api/agents/:id/stop', async (req, res) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log(`🛑 Stopping agent ${req.params.id}`);

    // Stop the deployment
    const stopResult = await deploymentManager.stopAgent(req.params.id);

    if (stopResult.success) {
      agent.status = 'stopped';
      agent.stoppedAt = new Date().toISOString();
      agent.updatedAt = new Date().toISOString();
      delete agent.containerUrl;
      agents.set(req.params.id, agent);
      await saveAgents();

      res.json({
        message: 'Agent stopped successfully',
        agentId: req.params.id,
        status: 'stopped'
      });
    } else {
      res.status(500).json({
        error: 'Failed to stop agent',
        details: stopResult.error
      });
    }

  } catch (error) {
    console.error('Error stopping agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start agent
app.post('/api/agents/:id/start', async (req, res) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log(`▶️ Starting agent ${req.params.id}`);

    // Deploy the agent if not already deployed
    const deployResult = await deploymentManager.deployAgent(req.params.id, agent.superiorAgentConfig);

    if (deployResult.success) {
      agent.status = 'running';
      agent.deployedAt = new Date().toISOString();
      agent.containerUrl = deployResult.url;
      agent.updatedAt = new Date().toISOString();
      agents.set(req.params.id, agent);
      await saveAgents();

      res.json({
        message: 'Agent started successfully',
        agentId: req.params.id,
        status: 'running',
        url: deployResult.url
      });
    } else {
      agent.status = 'failed';
      agent.error = deployResult.error;
      agent.updatedAt = new Date().toISOString();
      agents.set(req.params.id, agent);
      await saveAgents();

      res.status(500).json({
        error: 'Failed to start agent',
        details: deployResult.error
      });
    }

  } catch (error) {
    console.error('Error starting agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pause agent (stop but keep configuration)
app.post('/api/agents/:id/pause', async (req, res) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log(`⏸️ Pausing agent ${req.params.id}`);

    // Stop the deployment but mark as paused instead of stopped
    const stopResult = await deploymentManager.stopAgent(req.params.id);

    if (stopResult.success) {
      agent.status = 'paused';
      agent.pausedAt = new Date().toISOString();
      agent.updatedAt = new Date().toISOString();
      delete agent.containerUrl;
      agents.set(req.params.id, agent);
      await saveAgents();

      res.json({
        message: 'Agent paused successfully',
        agentId: req.params.id,
        status: 'paused'
      });
    } else {
      res.status(500).json({
        error: 'Failed to pause agent',
        details: stopResult.error
      });
    }

  } catch (error) {
    console.error('Error pausing agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete agent
app.post('/api/agents/:id/delete', async (req, res) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    console.log(`🗑️ Deleting agent ${req.params.id}`);

    // Stop the deployment first
    await deploymentManager.stopAgent(req.params.id);

    // Remove from agents map
    agents.delete(req.params.id);
    await saveAgents();

    res.json({
      message: 'Agent deleted successfully',
      agentId: req.params.id
    });

  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent deployment status
app.get('/api/agents/:id/status', async (req, res) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get real-time status from deployment manager
    const deploymentStatus = await deploymentManager.getAgentStatus(req.params.id);

    res.json({
      agentId: req.params.id,
      name: agent.name,
      configStatus: agent.status,
      deploymentStatus: deploymentStatus.status,
      url: deploymentStatus.url,
      deployedAt: agent.deployedAt,
      health: deploymentStatus.health,
      error: deploymentStatus.error
    });

  } catch (error) {
    console.error('Error getting agent status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get agent logs
app.get('/api/agents/:id/logs', async (req, res) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const { lines = 100, follow = false } = req.query;
    
    console.log(`📋 Getting logs for agent ${req.params.id} (${lines} lines, follow: ${follow})`);

    // Get container logs using docker logs command
    const containerName = `superior-agent-${req.params.id}`;
    const logCommand = `docker logs --tail ${lines} ${containerName} 2>&1`;
    
    const { promisify } = require('util');
    const { exec } = require('child_process');
    const execAsync = promisify(exec);
    
    if (follow === 'true') {
      // For streaming logs, we'll use Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial logs
      try {
        const initialLogs = await execAsync(logCommand);
        res.write(`data: ${JSON.stringify({ 
          type: 'logs', 
          content: initialLogs.stdout || initialLogs.stderr || 'No logs available',
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          content: `Error getting logs: ${error.message}`,
          timestamp: new Date().toISOString()
        })}\n\n`);
      }

      // Start following logs
      const { spawn } = require('child_process');
      const followProcess = spawn('docker', ['logs', '-f', '--tail', '0', containerName]);
      
      followProcess.stdout.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ 
          type: 'stdout', 
          content: data.toString(),
          timestamp: new Date().toISOString()
        })}\n\n`);
      });

      followProcess.stderr.on('data', (data) => {
        res.write(`data: ${JSON.stringify({ 
          type: 'stderr', 
          content: data.toString(),
          timestamp: new Date().toISOString()
        })}\n\n`);
      });

      followProcess.on('close', () => {
        res.write(`data: ${JSON.stringify({ 
          type: 'info', 
          content: 'Log stream ended',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      });

      // Clean up on client disconnect
      req.on('close', () => {
        followProcess.kill();
      });

    } else {
      // Static logs
      try {
        const result = await execAsync(logCommand);
        const logs = result.stdout || result.stderr || 'No logs available';
        
        res.json({
          agentId: req.params.id,
          agentName: agent.name,
          logs: logs.split('\n').filter(line => line.trim()),
          lines: parseInt(lines),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Error getting logs for agent ${req.params.id}:`, error);
        res.status(500).json({ 
          error: 'Failed to get agent logs',
          details: error.message 
        });
      }
    }

  } catch (error) {
    console.error('Error getting agent logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Interact with deployed agent
app.post('/api/agents/:id/interact', async (req, res) => {
  try {
    const agent = agents.get(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (!agent.containerUrl) {
      return res.status(400).json({ error: 'Agent is not deployed' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`💬 Sending message to agent ${req.params.id}: ${message}`);

    // Forward request to deployed agent
    const response = await fetch(`${agent.containerUrl}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`Agent responded with status ${response.status}`);
    }

    const result = await response.json();

    res.json({
      agentId: req.params.id,
      agentName: agent.name,
      userMessage: message,
      agentResponse: result.response,
      timestamp: result.timestamp,
      status: result.status
    });

  } catch (error) {
    console.error('Error interacting with agent:', error);
    res.status(500).json({ 
      error: 'Failed to communicate with agent',
      details: error.message 
    });
  }
});

// Generate Superior Agents compatible configuration
function generateSuperiorAgentConfig(agentConfig) {
  const { name, description, prompt, llm, mcps, rag } = agentConfig;

  // Map LLM selection to Superior Agents format
  const llmMapping = {
    'claude': 'claude',
    'gpt4': 'openai',
    'gemini': 'gemini',
    'deepseek': 'deepseek'
  };

  // Generate enhanced system prompt with MCP tools
  const mcpToolsDescription = generateMCPToolsDescription(mcps);
  const enhancedPrompt = `${prompt}\n\n${mcpToolsDescription}`;

  // Map MCPs to Superior Agents MCP client configuration (simplified for now)
  const mcpClients = mcps.map(mcpId => {
    const mcp = getMCPById(mcpId);
    if (!mcp) return null;

    return {
      id: mcp.id,
      name: mcp.name,
      description: mcp.description,
      transport: mcp.transport || 'stdio', // Add required transport field
      tools: mcp.tools.map(tool => ({
        name: tool.name,
        description: tool.description
      })),
      category: mcp.category
    };
  }).filter(Boolean);

  // Map RAG configuration
  const ragConfig = {
    enabled: true,
    type: rag,
    config: {
      embedding_model: 'text-embedding-3-small',
      chunk_size: 1000,
      chunk_overlap: 200
    }
  };

  return {
    agent_name: name,
    description: description,
    system_prompt: enhancedPrompt,
    llm_provider: llmMapping[llm] || 'claude',
    mcp_clients: mcpClients,
    rag: ragConfig,
    flows: {
      enabled: true,
      default_flow: 'research_strategy_execute'
    },
    container: {
      image: 'superior-agents:latest',
      resources: {
        memory: '512Mi',
        cpu: '0.5'
      }
    },
    deployment: {
      // Simplified deployment without external MCP containers for now
      mode: 'standalone',
      mcps_embedded: mcpClients.map(mcp => ({
        id: mcp.id,
        name: mcp.name,
        description: mcp.description,
        transport: mcp.transport,
        tools: mcp.tools
      }))
    }
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Superior Agents Platform Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 API base: http://localhost:${PORT}/api`);
  
  // Load persisted agents
  await loadAgents();
});

module.exports = app;