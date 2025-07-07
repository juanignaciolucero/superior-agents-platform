#!/bin/bash

# Install script for Superior Agents Platform MCPs
# This script installs Python dependencies for all MCPs

echo "🚀 Installing MCP dependencies..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed. Please install pip3."
    exit 1
fi

# Create virtual environment for MCPs
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install base MCP dependencies
echo "📚 Installing MCP SDK..."
pip install mcp>=1.0.0

# Install Price MCP dependencies
echo "💰 Installing Price MCP dependencies..."
cd price-mcp
pip install -r requirements.txt
cd ..

# Install News MCP dependencies  
echo "📰 Installing News MCP dependencies..."
cd news-mcp
pip install -r requirements.txt
cd ..

# Install Wallet MCP dependencies
echo "🏦 Installing Wallet MCP dependencies..."
cd wallet-mcp
pip install -r requirements.txt
cd ..

echo "✅ All MCP dependencies installed successfully!"
echo ""
echo "To use the MCPs:"
echo "1. Activate the virtual environment: source mcps/venv/bin/activate"
echo "2. Run an MCP server: python3 mcps/price-mcp/server.py"
echo ""
echo "The MCPs are now ready to be used by Superior Agents!"