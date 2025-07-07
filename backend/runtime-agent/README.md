# Superior Agents Runtime

![Python](https://img.shields.io/badge/python-%3E%3D3.9-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-supported-blue.svg)

The core runtime engine for Superior Agents Platform. This Python-based system provides sophisticated agent execution with multi-phase prompt workflows, iterative improvement capabilities, and support for multiple LLM providers.

## 🚀 Features

### 🧠 **Advanced Prompt Engineering**
- **Multi-Phase Workflows**: Research → Strategy → Execution → Regeneration
- **Iterative Improvement**: Agents learn from previous executions and errors
- **Context Awareness**: RAG integration for knowledge retrieval and strategy reuse
- **Error Handling**: Sophisticated retry and regeneration mechanisms

### 🤖 **Multi-LLM Support**
- **Claude (Anthropic)**: Advanced reasoning and analysis
- **OpenAI GPT**: Versatile and reliable performance
- **Google Gemini**: Fast and efficient processing (via OpenRouter and Direct API)
- **DeepSeek**: Specialized for code generation
- **Qwen**: Additional language model support

### 🔄 **Intelligent Workflows**
- **Trading Agent**: Complete cryptocurrency trading workflow with market analysis
- **Marketing Agent**: Social media and marketing campaign management
- **Extensible Architecture**: Easy to add new agent types and workflows

### 🐳 **Production-Ready Deployment**
- **Container Isolation**: Secure code execution in isolated environments
- **Health Monitoring**: Real-time health checks and status reporting
- **Database Integration**: SQLite-based persistence for agent state and metrics
- **Metric Collection**: Before/after state capture for performance analysis

## 🏗️ Architecture

```
Runtime Agent Architecture
├── 🧠 Agent Engine
│   ├── TradingAgent (crypto trading workflows)
│   ├── MarketingAgent (social media campaigns)
│   └── BaseAgent (extensible foundation)
├── 🔤 LLM Connectors (Genners)
│   ├── Claude (Anthropic API)
│   ├── OpenAI (GPT models)
│   ├── Gemini (Direct & OpenRouter)
│   ├── DeepSeek
│   └── Qwen
├── 🔄 Workflow Orchestration
│   ├── Multi-phase prompt execution
│   ├── Error handling & regeneration
│   └── Context management
├── 💾 Data Management
│   ├── SQLite database
│   ├── Strategy storage & retrieval
│   └── Metrics collection
└── 🐳 Container Management
    ├── Code execution isolation
    ├── Resource management
    └── Security boundaries
```

## 📋 Project Structure

```
runtime-agent/
├── 📁 src/                      # Source code
│   ├── 📁 agent/               # Agent implementations
│   │   ├── trading.py          # Trading agent & prompt generator
│   │   └── marketing.py        # Marketing agent & prompt generator
│   ├── 📁 genner/              # LLM connectors
│   │   ├── Claude.py           # Claude/Anthropic connector
│   │   ├── OAI.py              # OpenAI connector
│   │   ├── Gemini.py           # Gemini via OpenRouter
│   │   ├── GeminiDirect.py     # Direct Gemini API
│   │   ├── Deepseek.py         # DeepSeek connector
│   │   └── Qwen.py             # Qwen connector
│   ├── 📁 flows/               # Workflow orchestration
│   │   ├── trading.py          # Trading workflow (assisted_flow)
│   │   └── marketing.py        # Marketing workflow (unassisted_flow)
│   ├── 📁 db/                  # Database management
│   │   ├── interface.py        # Database interface
│   │   ├── sqlite.py           # SQLite implementation
│   │   └── *.sql               # SQL schema files
│   ├── 📁 sensor/              # Metric sensors
│   │   ├── trading.py          # Trading metrics collection
│   │   └── marketing.py        # Marketing metrics collection
│   ├── 📁 client/              # External integrations
│   │   ├── rag.py              # RAG client for knowledge retrieval
│   │   └── openrouter.py       # OpenRouter API client
│   ├── 📁 datatypes/           # Type definitions
│   │   ├── trading.py          # Trading data structures
│   │   └── marketing.py        # Marketing data structures
│   └── 📄 *.py                 # Core modules
├── 📁 data/                    # Configuration data
│   └── prompts.json            # All prompt templates
├── 📁 starter/                 # Starter configurations
│   ├── trading.json            # Trading agent starter config
│   └── marketing.json          # Marketing agent starter config
├── 📄 main.py                  # Main entry point
├── 📄 starter.py               # Startup script
├── 📄 test_runtime.py          # Runtime testing
└── 📄 requirements.txt         # Python dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Python** >= 3.9
- **Docker** (for containerized execution)
- **API Keys** for chosen LLM providers

### Installation

```bash
# Navigate to runtime-agent directory
cd backend/runtime-agent

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Environment Configuration

```env
# LLM API Keys (choose at least one)
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Trading-specific APIs (for trading agents)
COINGECKO_API_KEY=your_coingecko_api_key
ETH_RPC_URL=https://mainnet.infura.io/v3/your_key

# Marketing-specific APIs (for marketing agents)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret

# Database Configuration
DATABASE_URL=sqlite:./agents.db

# Container Configuration
CONTAINER_TIMEOUT=300
MAX_RETRIES=3
```

### Running the Agent

```bash
# Test the runtime
python test_runtime.py

# Run with starter configuration
python starter.py

# Run the main agent
python main.py
```

## 🧠 Multi-Phase Prompt System

The runtime implements a sophisticated prompt system with multiple phases that enable iterative improvement:

### Phase Workflow

```python
# Trading Agent Workflow
1. system_prompt              # Agent personality and context
2. research_code_prompt_first # Initial market research (no prior context)
3. research_code_prompt       # Subsequent research (with context)
4. address_research_code_prompt # Token address lookup
5. strategy_prompt            # Decision making and strategy formulation
6. trading_code_prompt        # Executable trading code generation
7. regen_code_prompt          # Error correction and code regeneration
```

### Example: Trading Agent Flow

```python
async def assisted_flow(agent_config, db_interface, container_manager):
    """
    Complete trading agent workflow with multi-phase execution
    """
    # Phase 1: Research
    research_prompt = agent.generate_research_prompt(context, rag_results)
    research_code = await llm.generate(research_prompt)
    research_results = await container.execute_code(research_code)
    
    # Phase 2: Strategy
    strategy_prompt = agent.generate_strategy_prompt(research_results)
    strategy = await llm.generate(strategy_prompt)
    
    # Phase 3: Execution
    execution_prompt = agent.generate_execution_prompt(strategy)
    execution_code = await llm.generate(execution_prompt)
    
    # Phase 4: Execute with retry logic
    for attempt in range(MAX_RETRIES):
        try:
            results = await container.execute_code(execution_code)
            break
        except Exception as error:
            # Phase 5: Regeneration
            regen_prompt = agent.generate_regen_prompt(execution_code, error)
            execution_code = await llm.generate(regen_prompt)
    
    return results
```

## 🔌 LLM Connectors (Genners)

### Supported Providers

#### Claude (Anthropic)
```python
# Claude connector with advanced reasoning
from genner.Claude import ClaudeGenner

claude = ClaudeGenner(api_key=ANTHROPIC_API_KEY)
response = await claude.generate(
    prompt="Analyze the current market conditions",
    model="claude-3-sonnet-20240229",
    max_tokens=4000
)
```

#### OpenAI
```python
# OpenAI GPT models
from genner.OAI import OpenAIGenner

openai = OpenAIGenner(api_key=OPENAI_API_KEY)
response = await openai.generate(
    prompt="Generate trading strategy",
    model="gpt-4-turbo-preview",
    max_tokens=2000
)
```

#### Gemini (Google)
```python
# Gemini via OpenRouter
from genner.Gemini import GeminiGenner

gemini = GeminiGenner(api_key=OPENROUTER_API_KEY)
response = await gemini.generate(
    prompt="Analyze market sentiment",
    model="google/gemini-pro-1.5"
)

# Direct Gemini API
from genner.GeminiDirect import GeminiDirectGenner

gemini_direct = GeminiDirectGenner(api_key=GEMINI_API_KEY)
```

### Adding Custom LLM Providers

1. **Create Genner Class**:
```python
# src/genner/CustomLLM.py
from genner.Base import BaseGenner

class CustomLLMGenner(BaseGenner):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.customllm.com/v1"
    
    async def generate(self, prompt: str, **kwargs) -> str:
        # Implement API call logic
        response = await self.call_api(prompt, **kwargs)
        return response.text
```

2. **Register in Factory**:
```python
# src/genner/__init__.py
from .CustomLLM import CustomLLMGenner

LLM_PROVIDERS = {
    'claude': ClaudeGenner,
    'openai': OpenAIGenner,
    'gemini': GeminiGenner,
    'custom': CustomLLMGenner,
}
```

## 🔄 Workflow Orchestration

### Trading Flow (`flows/trading.py`)

```python
async def assisted_flow(agent_config, db_interface, container_manager):
    """
    Assisted trading flow with human oversight capability
    """
    # Initialize agent and context
    agent = TradingAgent(agent_config)
    context = await build_context(db_interface)
    
    # Multi-phase execution
    for phase in ['research', 'strategy', 'execution']:
        prompt = agent.generate_prompt(phase, context)
        
        # Generate and execute with retry logic
        for attempt in range(MAX_RETRIES):
            try:
                code = await llm.generate(prompt)
                results = await container.execute_code(code)
                context.update(phase, results)
                break
            except Exception as error:
                if attempt == MAX_RETRIES - 1:
                    raise
                prompt = agent.generate_regen_prompt(code, error)
    
    # Store results and metrics
    await db_interface.store_execution(context.to_dict())
    return context.results
```

### Marketing Flow (`flows/marketing.py`)

```python
async def unassisted_flow(agent_config, db_interface, container_manager):
    """
    Autonomous marketing flow without human intervention
    """
    agent = MarketingAgent(agent_config)
    
    # Continuous execution loop
    while agent.should_continue():
        # Research current trends
        trend_data = await agent.research_trends()
        
        # Generate content strategy
        strategy = await agent.generate_strategy(trend_data)
        
        # Execute marketing actions
        results = await agent.execute_strategy(strategy)
        
        # Learn from results
        agent.update_knowledge(results)
        
        await asyncio.sleep(agent.execution_interval)
```

## 💾 Database Integration

### SQLite Schema

```sql
-- Agent execution tracking
CREATE TABLE agent_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    execution_type TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status TEXT NOT NULL,
    results JSON,
    metrics JSON
);

-- Strategy storage for RAG
CREATE TABLE strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_type TEXT NOT NULL,
    strategy_hash TEXT UNIQUE NOT NULL,
    strategy_content TEXT NOT NULL,
    performance_score REAL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metrics collection
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    metric_value REAL NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Interface

```python
from db.interface import DatabaseInterface

# Initialize database
db = DatabaseInterface(database_url="sqlite:./agents.db")

# Store execution results
await db.store_execution(
    agent_id="trading-001",
    execution_type="assisted_flow",
    results=execution_results,
    metrics=performance_metrics
)

# Retrieve successful strategies for RAG
strategies = await db.get_successful_strategies(
    agent_type="trading",
    min_performance_score=0.8,
    limit=5
)
```

## 🐳 Container Management

### Code Execution Isolation

```python
from container import ContainerManager

# Initialize container manager
container = ContainerManager(
    timeout=300,  # 5 minutes
    memory_limit="512MB",
    cpu_limit="0.5"
)

# Execute code safely
try:
    results = await container.execute_code(
        code=generated_code,
        language="python",
        environment={"API_KEY": "***masked***"}
    )
except ContainerTimeoutError:
    # Handle timeout
    pass
except ContainerSecurityError:
    # Handle security violation
    pass
```

### Security Features

- **Network Isolation**: Containers have limited network access
- **Resource Limits**: CPU and memory constraints
- **Timeout Protection**: Automatic termination of long-running processes
- **Filesystem Isolation**: Read-only code execution environment

## 📊 Metrics & Monitoring

### Performance Metrics

```python
from sensor.trading import TradingMetricsSensor

# Collect trading metrics
sensor = TradingMetricsSensor()

before_metrics = await sensor.collect_before_metrics(portfolio)
# ... execute trading strategy ...
after_metrics = await sensor.collect_after_metrics(portfolio)

performance = sensor.calculate_performance(before_metrics, after_metrics)
# {
#   'profit_loss': 0.025,  # 2.5% gain
#   'execution_time': 45.2,  # seconds
#   'success_rate': 0.92,
#   'risk_score': 0.15
# }
```

### Health Monitoring

```python
# Health check endpoint
async def health_check():
    return {
        "status": "healthy",
        "uptime": get_uptime(),
        "agent": {
            "status": agent.status,
            "last_execution": agent.last_execution.isoformat(),
            "success_rate": agent.success_rate
        },
        "resources": {
            "memory_usage": get_memory_usage(),
            "cpu_usage": get_cpu_usage()
        }
    }
```

## 🧪 Testing

### Unit Testing

```bash
# Run all tests
python -m pytest tests/

# Run specific test modules
python -m pytest tests/test_agents.py
python -m pytest tests/test_genners.py
python -m pytest tests/test_workflows.py

# Run with coverage
python -m pytest --cov=src tests/
```

### Integration Testing

```python
# test_runtime.py
async def test_trading_flow():
    """Test complete trading workflow"""
    agent_config = load_config("starter/trading.json")
    
    # Mock external dependencies
    with patch('genner.Claude.ClaudeGenner') as mock_llm:
        mock_llm.generate.return_value = "# Mock trading code"
        
        results = await assisted_flow(agent_config, db, container)
        
        assert results.status == "success"
        assert results.profit_loss is not None

async def test_llm_connectors():
    """Test all LLM connector functionality"""
    for provider in ['claude', 'openai', 'gemini']:
        genner = create_genner(provider)
        response = await genner.generate("Test prompt")
        assert len(response) > 0
```

### Load Testing

```python
# Simulate high-load scenarios
async def load_test():
    """Test agent under high load"""
    tasks = []
    
    for i in range(100):
        task = asyncio.create_task(
            execute_agent_workflow(f"agent-{i}")
        )
        tasks.append(task)
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    success_count = sum(1 for r in results if not isinstance(r, Exception))
    assert success_count >= 95  # 95% success rate required
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY data/ ./data/
COPY *.py ./

# Set environment variables
ENV PYTHONPATH=/app
ENV DATABASE_URL=sqlite:///app/data/agents.db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the agent
EXPOSE 8000
CMD ["python", "main.py"]
```

### Production Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  superior-agent:
    build: .
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=sqlite:///app/data/agents.db
    volumes:
      - agent_data:/app/data
    ports:
      - "8000:8000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  agent_data:
```

## 🔧 Configuration

### Agent Configuration

```json
{
  "agent_name": "Advanced Trading Agent",
  "agent_type": "trading",
  "llm_provider": "claude",
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 4000,
  "temperature": 0.1,
  "execution_config": {
    "max_retries": 3,
    "timeout_seconds": 300,
    "enable_rag": true,
    "container_limits": {
      "memory": "512MB",
      "cpu": "0.5"
    }
  },
  "trading_config": {
    "risk_tolerance": "medium",
    "max_position_size": 0.1,
    "enable_stop_loss": true,
    "portfolio_allocation": {
      "BTC": 0.4,
      "ETH": 0.3,
      "STABLES": 0.3
    }
  }
}
```

### Prompt Customization

```json
// data/prompts.json
{
  "trading": {
    "system_prompt": "You are an expert cryptocurrency trading agent...",
    "research_code_prompt_first": "Generate Python code to research current market conditions...",
    "strategy_prompt": "Based on the research data, formulate a trading strategy...",
    "trading_code_prompt": "Convert the strategy into executable trading code...",
    "regen_code_prompt": "The previous code failed with error: {error}. Fix the code..."
  },
  "marketing": {
    "system_prompt": "You are a creative marketing agent...",
    "research_code_prompt": "Research current social media trends...",
    "strategy_prompt": "Create a marketing campaign strategy...",
    "marketing_code_prompt": "Generate code to execute the marketing campaign..."
  }
}
```

## 🤝 Contributing

### Development Setup

1. **Clone and Setup**:
```bash
git clone <repository-url>
cd superior-agents-platform/backend/runtime-agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Pre-commit Hooks**:
```bash
pip install pre-commit
pre-commit install
```

### Code Standards

- **PEP 8**: Follow Python style guidelines
- **Type Hints**: Use type annotations for all functions
- **Docstrings**: Document all classes and functions
- **Testing**: Write tests for new functionality

```python
# Example function with proper typing and documentation
async def generate_trading_strategy(
    market_data: Dict[str, Any],
    risk_tolerance: float,
    portfolio: Portfolio
) -> TradingStrategy:
    """
    Generate a trading strategy based on market analysis.
    
    Args:
        market_data: Current market conditions and metrics
        risk_tolerance: Risk tolerance level (0.0 to 1.0)
        portfolio: Current portfolio state
        
    Returns:
        TradingStrategy: Generated trading strategy with actions
        
    Raises:
        ValidationError: If market_data is invalid
        InsufficientDataError: If not enough data for strategy generation
    """
    # Implementation here
    pass
```

### Adding New Agent Types

1. **Create Agent Class**:
```python
# src/agent/custom.py
from agent.base import BaseAgent

class CustomAgent(BaseAgent):
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.agent_type = "custom"
    
    def generate_research_prompt(self, context: Context) -> str:
        # Custom research prompt generation
        pass
    
    def generate_strategy_prompt(self, research_results: Any) -> str:
        # Custom strategy prompt generation
        pass
```

2. **Add Workflow**:
```python
# src/flows/custom.py
async def custom_flow(agent_config, db_interface, container_manager):
    # Custom workflow implementation
    pass
```

3. **Register in System**:
```python
# src/agent/__init__.py
from .custom import CustomAgent

AGENT_TYPES = {
    'trading': TradingAgent,
    'marketing': MarketingAgent,
    'custom': CustomAgent,
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

---

<div align="center">
<b>Superior Agents Runtime</b><br>
<i>Intelligent agent execution engine with advanced prompt workflows</i>
</div>