# Superior Agents Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.18.0-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black.svg)
![Python](https://img.shields.io/badge/python-%3E%3D3.9-blue.svg)

A comprehensive platform for creating, configuring, and deploying intelligent AI agents without technical knowledge. Build sophisticated agents with multi-phase workflows, advanced prompt engineering, and seamless deployment capabilities.

## 🌟 Key Features

### 🎯 **Visual Agent Configurator**
- **Intuitive Interface**: Step-by-step agent creation wizard
- **Real-time Validation**: Instant feedback on configuration errors
- **Configuration Preview**: Visual representation of agent settings
- **MCP Configuration**: Advanced Model Context Protocol setup with validation

### 🔌 **Extensive MCP (Model Context Protocol) Catalog**
- **Wallet Tracker**: Monitor cryptocurrency wallet transactions and balances
- **Price Feed**: Real-time cryptocurrency price monitoring with multiple APIs
- **News Aggregator**: Curated crypto and market news from multiple sources
- **Social Media Sensor**: Track mentions, trends, and sentiment analysis
- **Volume Analytics**: Trading volume and market depth analysis

### 🤖 **Multi-LLM Support**
- **Claude (Anthropic)**: Advanced reasoning and analysis
- **GPT-4 (OpenAI)**: Versatile and reliable performance
- **Gemini (Google)**: Fast and efficient processing
- **DeepSeek**: Specialized for code generation and technical tasks

### 🧠 **Advanced Prompt Engineering**
- **Multi-Phase Workflows**: Research → Strategy → Execution → Regeneration
- **Iterative Improvement**: Agents learn from previous executions
- **Context Awareness**: RAG integration for knowledge retrieval
- **Error Handling**: Sophisticated retry and regeneration mechanisms

### 🚀 **Production-Ready Deployment**
- **Docker Containerization**: Isolated agent execution environments
- **Real-time Monitoring**: Live logs and health checks
- **Persistent Storage**: Agent configurations survive restarts
- **Container Orchestration**: Automatic scaling and management

## 🏗️ Architecture Overview

```
Superior Agents Platform
├── 🌐 Frontend (Next.js + TypeScript)
│   ├── Agent Configurator
│   ├── Dashboard & Monitoring
│   └── MCP Configuration UI
├── ⚙️ Backend (Node.js + Express)
│   ├── Agent Management API
│   ├── MCP Catalog & Validation
│   ├── Deployment Manager
│   └── Persistence Layer
├── 🤖 Runtime Agent (Python)
│   ├── Multi-LLM Connectors
│   ├── Advanced Prompt System
│   ├── Workflow Orchestration
│   └── Container Execution
└── 🔌 MCP Ecosystem
    ├── Wallet Tracker MCP
    ├── Price Feed MCP
    └── News Aggregator MCP
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.18.0
- **Python** >= 3.9
- **Docker** (for agent deployment)
- **npm** or **yarn**

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/superior-agents-platform.git
cd superior-agents-platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install runtime agent dependencies
cd ../backend/runtime-agent
pip install -r requirements.txt
```

### 2. Environment Setup

Create environment files:

```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:
```env
# Backend Configuration
PORT=3003
NODE_ENV=development

# LLM API Keys (choose at least one)
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# MCP API Keys (optional, for specific MCPs)
COINGECKO_API_KEY=your_coingecko_api_key
```

### 3. Start the Platform

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Access the platform:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **API Documentation**: http://localhost:3003/health

## 📖 User Guide

### Creating Your First Agent

1. **Navigate to Agent Creator**: Click "Create Agent" on the dashboard
2. **Configure Basic Settings**:
   - Agent name and description
   - Select LLM provider (Claude, GPT-4, Gemini, DeepSeek)
   - Choose agent type (Trading, Marketing, General)

3. **Write Agent Prompt**: Define the agent's personality and objectives
4. **Select MCPs**: Choose relevant Model Context Protocols:
   - Wallet Tracker (for portfolio monitoring)
   - Price Feed (for market data)
   - News Aggregator (for market news)

5. **Configure MCPs**: Provide required API keys and settings
6. **Deploy Agent**: Launch your agent in a containerized environment

### Advanced Configuration

#### Multi-Phase Prompt System
Agents use sophisticated prompt workflows:
- **Research Phase**: Gather market data and information
- **Strategy Phase**: Analyze data and formulate decisions
- **Execution Phase**: Convert strategy to actionable code
- **Regeneration Phase**: Handle errors and improve code

#### MCP Configuration
Each MCP requires specific configuration:
- **API Keys**: External service authentication
- **Parameters**: Customizable behavior settings
- **Validation**: Real-time configuration validation

## 🛠️ Development

### Project Structure

```
superior-agents-platform/
├── 📁 backend/                 # Node.js API Server
│   ├── index.js               # Express application
│   ├── mcpCatalog.js          # MCP definitions and catalog
│   ├── mcpConfigManager.js    # MCP configuration management
│   ├── deploymentManager.js   # Docker deployment orchestration
│   └── runtime-agent/         # Python agent runtime
├── 📁 frontend/               # Next.js Application
│   ├── src/app/              # Next.js App Router
│   └── src/components/       # React components
├── 📁 mcps/                  # Model Context Protocol implementations
│   ├── wallet-mcp/          # Wallet tracking MCP
│   ├── price-mcp/           # Price monitoring MCP
│   └── news-mcp/            # News aggregation MCP
└── 📄 README.md
```

### Development Commands

```bash
# Backend development
cd backend
npm run dev          # Start with hot reload
npm start            # Production mode
npm test             # Run tests

# Frontend development
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check

# Runtime agent testing
cd backend/runtime-agent
python test_runtime.py    # Test agent functionality
python main.py            # Run agent standalone
```

### Adding New MCPs

1. **Create MCP Directory**: `mcps/your-mcp/`
2. **Implement Server**: Follow MCP protocol specification
3. **Add to Catalog**: Register in `backend/mcpCatalog.js`
4. **Configure Frontend**: Add UI for MCP configuration

## 🔒 Security & Best Practices

### API Key Management
- Store sensitive keys in environment variables
- Never commit API keys to version control
- Use different keys for development and production

### Container Security
- Agents run in isolated Docker containers
- Limited resource allocation and network access
- Automatic cleanup of failed deployments

### Input Validation
- Comprehensive validation for all user inputs
- MCP configuration validation before deployment
- Sanitization of agent prompts and configurations

## 📊 Monitoring & Analytics

### Real-time Monitoring
- **Agent Status**: Live status monitoring for all deployed agents
- **Container Health**: Health checks and resource usage
- **Error Tracking**: Comprehensive error logging and alerting

### Performance Metrics
- **Execution Time**: Track agent response times
- **Success Rates**: Monitor agent execution success/failure rates
- **Resource Usage**: Container CPU and memory utilization

---