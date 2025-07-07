#!/usr/bin/env python3
"""
Price MCP Server - Real-time cryptocurrency price data via CoinGecko API
Model Context Protocol (MCP) implementation for cryptocurrency price data
"""

import asyncio
import json
import sys
from typing import Dict, List, Any, Optional
import aiohttp
from datetime import datetime, timedelta
import logging

# MCP imports
from mcp.server import Server
from mcp.types import (
    Resource, 
    Tool, 
    TextContent, 
    ImageContent, 
    EmbeddedResource,
    LoggingLevel
)
import mcp.server.stdio
import mcp.types as types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("price-mcp")

class PriceMCPServer:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes cache
        
    async def ensure_session(self):
        """Ensure aiohttp session exists"""
        if not self.session:
            self.session = aiohttp.ClientSession()
    
    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
    
    async def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make API request to CoinGecko"""
        await self.ensure_session()
        
        cache_key = f"{endpoint}:{json.dumps(params or {}, sort_keys=True)}"
        now = datetime.now()
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (now - timestamp).seconds < self.cache_ttl:
                logger.info(f"Cache hit for {endpoint}")
                return cached_data
        
        url = f"{self.base_url}/{endpoint}"
        
        try:
            async with self.session.get(url, params=params) as response:
                response.raise_for_status()
                data = await response.json()
                
                # Cache the result
                self.cache[cache_key] = (data, now)
                logger.info(f"API call successful: {endpoint}")
                return data
                
        except Exception as e:
            logger.error(f"API request failed: {e}")
            raise Exception(f"Failed to fetch data from CoinGecko: {str(e)}")

# Create server instance
server = Server("price-mcp")
price_server = PriceMCPServer()

@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """List available resources"""
    return [
        Resource(
            uri="price://crypto/live",
            name="Live Crypto Prices",
            description="Real-time cryptocurrency prices",
            mimeType="application/json"
        ),
        Resource(
            uri="price://crypto/trending",
            name="Trending Cryptocurrencies",
            description="Currently trending cryptocurrencies",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """Read resource content"""
    if uri == "price://crypto/live":
        # Get top 10 cryptocurrencies by market cap
        data = await price_server._make_request(
            "coins/markets",
            {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 10,
                "page": 1
            }
        )
        return json.dumps(data, indent=2)
    
    elif uri == "price://crypto/trending":
        data = await price_server._make_request("search/trending")
        return json.dumps(data, indent=2)
    
    else:
        raise ValueError(f"Unknown resource: {uri}")

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools"""
    return [
        Tool(
            name="get_price",
            description="Get current price for a cryptocurrency",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Cryptocurrency symbol (e.g., bitcoin, ethereum)"
                    },
                    "vs_currency": {
                        "type": "string",
                        "description": "Target currency (default: usd)",
                        "default": "usd"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="get_historical_prices",
            description="Get historical price data for a cryptocurrency",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Cryptocurrency symbol"
                    },
                    "vs_currency": {
                        "type": "string", 
                        "description": "Target currency (default: usd)",
                        "default": "usd"
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of days of historical data (1-365)",
                        "default": 7
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="get_market_data",
            description="Get comprehensive market data for a cryptocurrency",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Cryptocurrency symbol"
                    }
                },
                "required": ["symbol"]
            }
        ),
        Tool(
            name="search_coins",
            description="Search for cryptocurrencies by name or symbol",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query (name or symbol)"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_trending",
            description="Get currently trending cryptocurrencies",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
    """Handle tool calls"""
    
    try:
        if name == "get_price":
            symbol = arguments.get("symbol")
            vs_currency = arguments.get("vs_currency", "usd")
            
            data = await price_server._make_request(
                "simple/price",
                {
                    "ids": symbol,
                    "vs_currencies": vs_currency,
                    "include_24hr_change": "true",
                    "include_market_cap": "true",
                    "include_24hr_vol": "true"
                }
            )
            
            if not data:
                return [types.TextContent(
                    type="text",
                    text=f"No price data found for {symbol}"
                )]
            
            result = {
                "symbol": symbol,
                "data": data,
                "timestamp": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "get_historical_prices":
            symbol = arguments.get("symbol")
            vs_currency = arguments.get("vs_currency", "usd")
            days = arguments.get("days", 7)
            
            data = await price_server._make_request(
                f"coins/{symbol}/market_chart",
                {
                    "vs_currency": vs_currency,
                    "days": str(days)
                }
            )
            
            # Format data for better readability
            prices = data.get("prices", [])
            formatted_prices = []
            for price_point in prices[-10:]:  # Last 10 data points
                timestamp = datetime.fromtimestamp(price_point[0] / 1000)
                formatted_prices.append({
                    "timestamp": timestamp.isoformat(),
                    "price": price_point[1]
                })
            
            result = {
                "symbol": symbol,
                "vs_currency": vs_currency,
                "days": days,
                "recent_prices": formatted_prices,
                "total_data_points": len(prices)
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "get_market_data":
            symbol = arguments.get("symbol")
            
            data = await price_server._make_request(f"coins/{symbol}")
            
            # Extract key market data
            market_data = data.get("market_data", {})
            result = {
                "symbol": symbol,
                "name": data.get("name"),
                "current_price": market_data.get("current_price", {}).get("usd"),
                "market_cap": market_data.get("market_cap", {}).get("usd"),
                "total_volume": market_data.get("total_volume", {}).get("usd"),
                "price_change_24h": market_data.get("price_change_percentage_24h"),
                "price_change_7d": market_data.get("price_change_percentage_7d"),
                "price_change_30d": market_data.get("price_change_percentage_30d"),
                "ath": market_data.get("ath", {}).get("usd"),
                "atl": market_data.get("atl", {}).get("usd"),
                "timestamp": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "search_coins":
            query = arguments.get("query")
            
            data = await price_server._make_request(
                "search",
                {"query": query}
            )
            
            # Format search results
            coins = data.get("coins", [])[:10]  # Top 10 results
            formatted_results = []
            for coin in coins:
                formatted_results.append({
                    "id": coin.get("id"),
                    "name": coin.get("name"),
                    "symbol": coin.get("symbol"),
                    "market_cap_rank": coin.get("market_cap_rank")
                })
            
            result = {
                "query": query,
                "results": formatted_results,
                "total_found": len(data.get("coins", []))
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "get_trending":
            data = await price_server._make_request("search/trending")
            
            # Format trending data
            trending_coins = []
            for coin in data.get("coins", []):
                trending_coins.append({
                    "name": coin.get("item", {}).get("name"),
                    "symbol": coin.get("item", {}).get("symbol"),
                    "market_cap_rank": coin.get("item", {}).get("market_cap_rank"),
                    "price_btc": coin.get("item", {}).get("price_btc")
                })
            
            result = {
                "trending_coins": trending_coins,
                "timestamp": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text", 
                text=json.dumps(result, indent=2)
            )]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
            
    except Exception as e:
        logger.error(f"Tool execution failed: {e}")
        return [types.TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]

async def main():
    """Main server function"""
    try:
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options()
            )
    finally:
        await price_server.close()

if __name__ == "__main__":
    asyncio.run(main())