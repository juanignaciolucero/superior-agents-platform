# Superior Agents Platform - Backend

![Node.js](https://img.shields.io/badge/node-%3E%3D18.18.0-green.svg)
![Express](https://img.shields.io/badge/express-4.21.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

The backend API server for the Superior Agents Platform. Built with Node.js and Express, this service provides comprehensive agent management, MCP configuration, deployment orchestration, and persistent storage capabilities.

## 🏗️ Architecture

```
Backend Services
├── 🌐 Express API Server
│   ├── Agent Management
│   ├── MCP Catalog & Configuration
│   ├── Deployment Orchestration
│   └── Authentication & Security
├── 🐳 Docker Deployment Manager
│   ├── Container Orchestration
│   ├── Health Monitoring
│   └── Log Management
├── 💾 Persistent Storage
│   ├── Agent Configurations
│   ├── MCP Settings
│   └── Deployment State
└── 🔌 MCP Ecosystem
    ├── Configuration Validation
    ├── Runtime Integration
    └── Dynamic Loading
```

## 🚀 Features

### 🎯 **Agent Management**
- **CRUD Operations**: Create, read, update, delete agents
- **Configuration Validation**: Real-time validation of agent settings
- **State Management**: Persistent agent state across restarts
- **Deployment Control**: Start, stop, pause, and delete deployments

### 🔌 **MCP (Model Context Protocol) System**
- **Catalog Management**: Comprehensive MCP catalog with categories
- **Configuration Engine**: Dynamic configuration forms with validation
- **Requirements Analysis**: Automatic detection of configuration needs
- **Deployment Readiness**: Pre-deployment validation checks

### 🐳 **Docker Deployment**
- **Container Orchestration**: Automated Docker container management
- **Health Monitoring**: Real-time health checks and status monitoring
- **Log Streaming**: Live log streaming from deployed agents
- **Resource Management**: CPU and memory allocation control

### 🤖 **LLM Integration**
- **Multi-Provider Support**: Claude, OpenAI, Gemini, DeepSeek
- **Prompt Enhancement**: AI-powered prompt improvement
- **Smart Recommendations**: Intelligent MCP suggestions based on agent purpose
- **Context Awareness**: RAG integration for enhanced responses

## 📋 API Endpoints

### Agent Management
```http
GET    /api/agents                    # List all agents
POST   /api/agents                    # Create new agent
GET    /api/agents/:id                # Get agent details
POST   /api/agents/:id/deploy         # Deploy agent
POST   /api/agents/:id/start          # Start agent
POST   /api/agents/:id/stop           # Stop agent
POST   /api/agents/:id/pause          # Pause agent
POST   /api/agents/:id/delete         # Delete agent
GET    /api/agents/:id/status         # Get deployment status
GET    /api/agents/:id/logs           # Get agent logs
POST   /api/agents/:id/interact       # Interact with agent
```

### MCP Management
```http
GET    /api/mcps                      # List available MCPs
GET    /api/mcps/:id                  # Get MCP details
GET    /api/mcps/:id/config           # Get MCP configuration requirements
POST   /api/mcps/:id/validate-config  # Validate MCP configuration
POST   /api/mcps/analyze              # Get MCP recommendations
POST   /api/mcps/config-requirements  # Bulk configuration requirements
```

### MCP Configuration
```http
POST   /api/agents/:id/mcp-config     # Save agent MCP configuration
GET    /api/agents/:id/mcp-config     # Get agent MCP configuration
GET    /api/agents/:id/deployment-readiness  # Check deployment readiness
```

### Prompt Enhancement
```http
POST   /api/prompts/enhance           # Enhance agent prompt with AI
```

### System
```http
GET    /health                        # Health check
GET    /api/configurations            # Get all configurations
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** >= 18.18.0
- **npm** or **yarn**
- **Docker** (for agent deployment)

### Installation

```bash
# Clone and navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3003
NODE_ENV=development

# LLM API Keys (at least one required)
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# MCP-specific API Keys (optional)
COINGECKO_API_KEY=your_coingecko_api_key_here
TWITTER_API_KEY=your_twitter_api_key_here
NEWS_API_KEY=your_news_api_key_here

# JWT Configuration (for future authentication)
JWT_SECRET=your_super_secret_jwt_key_here

# Database Configuration (future expansion)
DATABASE_URL=sqlite:./agents.db
```

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## 🔧 Core Components

### Agent Management (`index.js`)
The main Express application handling all API routes and core functionality:

- **Agent CRUD**: Complete agent lifecycle management
- **Deployment Pipeline**: Orchestration of agent deployment process
- **Persistent Storage**: JSON-based storage with auto-save functionality
- **Error Handling**: Comprehensive error handling and logging

### MCP Catalog (`mcpCatalog.js`)
Centralized catalog of available Model Context Protocols:

```javascript
// Example MCP definition
{
  id: 'wallet-tracker',
  name: 'Wallet Tracker',
  description: 'Monitor cryptocurrency wallet transactions and balances',
  category: 'DeFi',
  version: '1.0.0',
  config: {
    configFields: [
      {
        key: 'ETH_RPC_URL',
        label: 'Ethereum RPC URL',
        type: 'url',
        required: true,
        description: 'RPC endpoint for Ethereum network'
      }
    ]
  }
}
```

### MCP Configuration Manager (`mcpConfigManager.js`)
Handles MCP configuration validation and management:

- **Validation Engine**: Comprehensive field validation with custom rules
- **Requirements Analysis**: Automatic detection of configuration needs
- **Cross-field Validation**: Complex validation logic between related fields
- **Deployment Readiness**: Pre-deployment validation checks

### Deployment Manager (`deploymentManager.js`)
Docker-based deployment orchestration:

- **Container Management**: Docker Compose orchestration
- **Health Monitoring**: Automated health checks and status reporting
- **Log Management**: Real-time log streaming and aggregation
- **Resource Control**: CPU and memory allocation management

## 🔌 MCP Integration

### Available MCPs

#### Wallet Tracker MCP
Monitor cryptocurrency wallet transactions and balances:
```javascript
// Configuration fields
ETH_RPC_URL: 'https://mainnet.infura.io/v3/your-key'
WALLET_ADDRESSES: '0x...,0x...'  // Comma-separated addresses
SOL_RPC_URL: 'https://api.mainnet-beta.solana.com'  // Optional
SOL_WALLET_ADDRESSES: 'addr1,addr2'  // Optional
```

#### Price Feed MCP
Real-time cryptocurrency price monitoring:
```javascript
// Configuration fields
COINGECKO_API_KEY: 'your-coingecko-api-key'
CRYPTOCOMPARE_API_KEY: 'your-cryptocompare-api-key'  // Optional
UPDATE_INTERVAL: '60'  // Seconds between updates
```

#### News Aggregator MCP
Curated crypto and market news:
```javascript
// Configuration fields
NEWS_API_KEY: 'your-news-api-key'
FEED_SOURCES: 'coindesk,cointelegraph,decrypt'
UPDATE_INTERVAL: '300'  // Seconds between updates
```

### Adding Custom MCPs

1. **Define MCP in Catalog**:
```javascript
// Add to mcpCatalog.js
{
  id: 'custom-mcp',
  name: 'Custom MCP',
  description: 'Your custom MCP description',
  category: 'Custom',
  config: {
    configFields: [
      {
        key: 'API_KEY',
        label: 'API Key',
        type: 'text',
        required: true,
        description: 'Your service API key'
      }
    ]
  }
}
```

2. **Implement MCP Server**: Create MCP server following the protocol specification

3. **Add Validation Logic**: Extend `mcpConfigManager.js` with custom validation rules

## 🛡️ Security

### Input Validation
- **Comprehensive Validation**: All inputs validated before processing
- **Sanitization**: XSS and injection attack prevention
- **Type Safety**: Strong typing for all configuration fields

### Container Security
- **Isolation**: Agents run in isolated Docker containers
- **Resource Limits**: CPU and memory constraints
- **Network Security**: Limited network access for containers

### API Security
- **CORS Protection**: Configured CORS policies
- **Rate Limiting**: Protection against abuse (future implementation)
- **Authentication**: JWT-based authentication (future implementation)

## 📊 Monitoring & Logging

### Health Monitoring
```http
GET /health
```
Returns:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "125MB",
    "total": "512MB"
  }
}
```

### Agent Status Monitoring
Real-time monitoring of deployed agents:
- **Container Health**: Docker health check status
- **Resource Usage**: CPU and memory utilization
- **Response Times**: Agent response time metrics
- **Error Rates**: Success/failure statistics

### Logging System
Comprehensive logging with different levels:
```javascript
console.log('📋 LISTING 3 AGENTS');
console.log('✅ DEPLOYMENT COMPLETED');
console.log('❌ DEPLOYMENT FAILED');
console.log('🔧 MCP CONFIG VALIDATION');
```

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Integration Tests
```bash
# Test MCP configuration
curl -X POST http://localhost:3003/api/mcps/wallet-tracker/validate-config \
  -H "Content-Type: application/json" \
  -d '{"configValues": {"ETH_RPC_URL": "https://mainnet.infura.io/v3/test"}}'

# Test agent creation
curl -X POST http://localhost:3003/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "description": "Testing agent",
    "prompt": "You are a test agent",
    "llm": "claude",
    "mcps": [],
    "rag": "none"
  }'
```

### Load Testing
Use tools like Apache Bench or Artillery for load testing:
```bash
# Basic load test
ab -n 100 -c 10 http://localhost:3003/health

# Advanced load testing with Artillery
artillery quick --count 10 --num 5 http://localhost:3003/api/agents
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Use PM2 for process management (recommended)
npm install -g pm2
pm2 start index.js --name "superior-agents-backend"
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3003
CMD ["npm", "start"]
```

## 📚 API Documentation

### Error Responses
All API endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/agents",
  "method": "POST"
}
```

### Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-backend-improvement`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Submit a pull request

### Code Style
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **JSDoc**: Comprehensive function documentation
- **Error Handling**: Consistent error handling patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">
<b>Superior Agents Platform Backend</b><br>
<i>Powering intelligent agent deployment and management</i>
</div>