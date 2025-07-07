const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DeploymentManager {
  constructor() {
    this.runningAgents = new Map();
    this.deploymentDir = path.join(__dirname, '../runtime-agent');
  }

  /**
   * Generate docker-compose.yml for an agent
   */
  generateDockerCompose(agentId, agentConfig) {
    const { mcp_clients = [], agent_name } = agentConfig;
    
    const services = {
      [`agent-${agentId}`]: {
        build: {
          context: '../runtime-agent',
          dockerfile: 'Dockerfile'
        },
        container_name: `superior-agent-${agentId}`,
        environment: [
          'AGENT_CONFIG_PATH=/app/config.json',
          'AGENT_PORT=8000'
        ],
        volumes: [
          `${path.resolve(__dirname, '../agent-configs')}/${agentId}.json:/app/config.json:ro`
        ],
        ports: [`${3100 + parseInt(agentId.slice(-3), 16) % 900}:8000`],
        healthcheck: {
          test: ['CMD', 'curl', '-f', 'http://localhost:8000/health'],
          interval: '30s',
          timeout: '10s',
          retries: 3,
          start_period: '40s'
        },
        restart: 'unless-stopped',
        networks: ['superior-agents']
      }
    };

    // Note: MCPs are now Python scripts that run as subprocesses, not Docker containers
    // The agent runtime will spawn them as needed using stdio transport

    const compose = {
      services,
      networks: {
        'superior-agents': {
          driver: 'bridge'
        }
      }
    };

    return compose;
  }

  /**
   * Save agent configuration to file
   */
  async saveAgentConfig(agentId, config) {
    const configDir = path.join(__dirname, '../agent-configs');
    await fs.mkdir(configDir, { recursive: true });
    
    const configPath = path.join(configDir, `${agentId}.json`);
    
    // Ensure the file doesn't exist as a directory
    try {
      const stats = await fs.stat(configPath);
      if (stats.isDirectory()) {
        await fs.rmdir(configPath, { recursive: true });
        console.log(`🗑️  Removed directory at config path: ${configPath}`);
      }
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(`💾 Saved agent config: ${configPath}`);
    console.log(`📏 Config file size: ${(await fs.stat(configPath)).size} bytes`);
    return configPath;
  }

  /**
   * Save docker-compose file
   */
  async saveDockerCompose(agentId, compose) {
    const composeDir = path.join(__dirname, '../deployments');
    await fs.mkdir(composeDir, { recursive: true });
    
    const composePath = path.join(composeDir, `${agentId}-compose.yml`);
    const yamlContent = this.objectToYaml(compose);
    await fs.writeFile(composePath, yamlContent);
    
    console.log(`🐳 Saved docker-compose: ${composePath}`);
    return composePath;
  }

  /**
   * Convert object to YAML (simple implementation)
   */
  objectToYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this.objectToYaml(item, indent + 2);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        const valueStr = typeof value === 'string' ? `"${value}"` : value;
        yaml += `${spaces}${key}: ${valueStr}\n`;
      }
    }

    return yaml;
  }

  /**
   * Deploy agent using Docker Compose
   */
  async deployAgent(agentId, agentConfig) {
    try {
      console.log(`🚀 Starting deployment for agent ${agentId}`);

      // 1. Save agent configuration
      await this.saveAgentConfig(agentId, agentConfig);

      // 2. Generate and save docker-compose
      const compose = this.generateDockerCompose(agentId, agentConfig);
      const composePath = await this.saveDockerCompose(agentId, compose);

      // 3. Build the agent runtime image
      console.log('🔨 Building agent runtime image...');
      const buildResult = await execAsync('docker build -t superior-agent-runtime .', {
        cwd: this.deploymentDir
      });
      console.log('✅ Agent runtime image built');

      // 4. Deploy using docker-compose
      console.log('🐳 Deploying with docker-compose...');
      console.log(`📁 Compose file: ${composePath}`);
      console.log(`📁 Working directory: ${path.dirname(composePath)}`);
      
      const deployResult = await execAsync(`docker-compose -f ${composePath} up -d`, {
        cwd: path.dirname(composePath)
      });
      
      console.log('🐳 Docker-compose output:', deployResult.stdout);
      if (deployResult.stderr) {
        console.log('⚠️  Docker-compose warnings:', deployResult.stderr);
      }

      // 5. Wait for health check
      const port = 3100 + parseInt(agentId.slice(-3), 16) % 900;
      const agentUrl = `http://localhost:${port}`;
      
      console.log('⏳ Waiting for agent to be healthy...');
      const isHealthy = await this.waitForHealth(agentUrl, 60); // 60 second timeout

      if (isHealthy) {
        this.runningAgents.set(agentId, {
          url: agentUrl,
          composePath,
          status: 'running',
          deployedAt: new Date().toISOString()
        });

        console.log(`✅ Agent ${agentId} deployed successfully at ${agentUrl}`);
        return {
          success: true,
          agentId,
          url: agentUrl,
          status: 'running'
        };
      } else {
        throw new Error('Agent failed health check');
      }

    } catch (error) {
      console.error(`❌ Deployment failed for agent ${agentId}:`, error);
      
      // Cleanup on failure
      await this.stopAgent(agentId);
      
      return {
        success: false,
        agentId,
        error: error.message
      };
    }
  }

  /**
   * Wait for agent to pass health check
   */
  async waitForHealth(url, timeoutSeconds = 60) {
    const timeout = timeoutSeconds * 1000;
    const interval = 2000; // Check every 2 seconds
    const maxAttempts = Math.floor(timeout / interval);

    console.log(`🏥 Starting health checks for ${url} (${maxAttempts} attempts max)`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 Health check attempt ${attempt}/${maxAttempts}: ${url}/health`);
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const response = await fetch(`${url}/health`);
        
        console.log(`📡 Response status: ${response.status}`);
        
        if (response.ok) {
          const healthData = await response.text();
          console.log(`✅ Agent health check passed (attempt ${attempt})`);
          console.log(`📊 Health response: ${healthData}`);
          return true;
        } else {
          console.log(`❌ Health check failed with status: ${response.status}`);
        }
      } catch (error) {
        console.log(`🔄 Health check attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
        
        // Check if container is running
        if (attempt % 5 === 0) {
          try {
            const { execAsync } = require('util').promisify(require('child_process').exec);
            const containerName = url.includes('3100') ? url.split(':')[2] : 'unknown';
            const logs = await execAsync(`docker logs --tail 10 superior-agent-${containerName} 2>&1 || echo "No logs available"`);
            console.log(`📋 Container logs (last 10 lines):\n${logs.stdout}`);
          } catch (logError) {
            console.log(`⚠️  Could not fetch container logs: ${logError.message}`);
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    console.log(`❌ Health check timeout after ${timeoutSeconds} seconds`);
    return false;
  }

  /**
   * Stop and remove agent deployment
   */
  async stopAgent(agentId) {
    try {
      const agent = this.runningAgents.get(agentId);
      if (!agent) {
        console.log(`⚠️  Agent ${agentId} not found in running agents`);
        return { success: false, error: 'Agent not found' };
      }

      console.log(`🛑 Stopping agent ${agentId}`);

      // Stop docker-compose services
      if (agent.composePath && await fs.access(agent.composePath).then(() => true).catch(() => false)) {
        await execAsync(`docker-compose -f ${agent.composePath} down`);
        console.log(`🐳 Docker services stopped for agent ${agentId}`);
      }

      // Remove from running agents
      this.runningAgents.delete(agentId);

      console.log(`✅ Agent ${agentId} stopped successfully`);
      return { success: true, agentId };

    } catch (error) {
      console.error(`❌ Failed to stop agent ${agentId}:`, error);
      return { success: false, agentId, error: error.message };
    }
  }

  /**
   * Get status of running agents
   */
  getRunningAgents() {
    return Array.from(this.runningAgents.entries()).map(([id, info]) => ({
      agentId: id,
      ...info
    }));
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId) {
    const agent = this.runningAgents.get(agentId);
    if (!agent) {
      return { status: 'not_running' };
    }

    try {
      const response = await fetch(`${agent.url}/health`);
      if (response.ok) {
        const health = await response.json();
        return {
          status: 'healthy',
          url: agent.url,
          health,
          deployedAt: agent.deployedAt
        };
      } else {
        return {
          status: 'unhealthy',
          url: agent.url,
          deployedAt: agent.deployedAt
        };
      }
    } catch (error) {
      return {
        status: 'unreachable',
        url: agent.url,
        error: error.message,
        deployedAt: agent.deployedAt
      };
    }
  }
}

module.exports = DeploymentManager;