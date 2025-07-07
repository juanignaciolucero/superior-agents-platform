"""
FastAPI server for Superior Agent runtime
"""
import asyncio
import json
import os
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from datetime import datetime

from .agent import create_agent_from_config, SuperiorAgent

app = FastAPI(title="Superior Agent Runtime", version="1.0.0")

# Global agent instance
current_agent: SuperiorAgent = None
startup_time = datetime.now()

class ProcessRequest(BaseModel):
    message: str
    context: Dict[str, Any] = {}

class AgentResponse(BaseModel):
    response: str
    status: str
    timestamp: str
    tools_used: list = []

@app.on_event("startup")
async def startup():
    """Initialize agent from configuration"""
    global current_agent
    
    # Try to load configuration from environment or file
    config_path = os.getenv('AGENT_CONFIG_PATH', '/app/config.json')
    
    if os.path.exists(config_path):
        print(f"📄 Loading agent configuration from {config_path}")
        with open(config_path, 'r') as f:
            config = json.load(f)
    else:
        print("⚠️  No configuration file found, using default config")
        config = {
            "agent_name": "Default Agent",
            "description": "Default Superior Agent",
            "system_prompt": "You are a helpful AI assistant.",
            "llm_provider": "claude",
            "mcp_clients": [],
            "rag": {"enabled": False},
            "flows": {"enabled": True}
        }
    
    try:
        current_agent = await create_agent_from_config(config)
        print(f"✅ Agent '{current_agent.config.agent_name}' started successfully")
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if current_agent:
        agent_health = await current_agent.health_check()
        return {
            "status": "healthy",
            "uptime": str(datetime.now() - startup_time),
            "agent": agent_health
        }
    else:
        raise HTTPException(status_code=503, detail="Agent not initialized")

@app.get("/info")
async def get_agent_info():
    """Get agent information"""
    if not current_agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    tools = await current_agent.get_available_tools()
    
    return {
        "agent_name": current_agent.config.agent_name,
        "description": current_agent.config.description,
        "llm_provider": current_agent.config.llm_provider,
        "mcp_clients": [client.name for client in current_agent.mcp_clients.values()],
        "available_tools": list(tools.keys()),
        "status": current_agent.status
    }

@app.post("/process", response_model=AgentResponse)
async def process_message(request: ProcessRequest):
    """Process a message through the agent"""
    if not current_agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        print(f"📨 Processing message: {request.message}")
        response = await current_agent.process_request(request.message)
        
        return AgentResponse(
            response=response,
            status=current_agent.status,
            timestamp=datetime.now().isoformat(),
            tools_used=[]  # TODO: Track actual tools used
        )
    
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.get("/tools")
async def get_available_tools():
    """Get all available tools"""
    if not current_agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    tools = await current_agent.get_available_tools()
    return {"tools": tools}

@app.post("/tools/{tool_path}")
async def call_tool(tool_path: str, params: Dict[str, Any] = {}):
    """Call a specific tool directly"""
    if not current_agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        result = await current_agent.call_tool(tool_path, params)
        return {
            "tool": tool_path,
            "params": params,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tool call error: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv('AGENT_PORT', 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")