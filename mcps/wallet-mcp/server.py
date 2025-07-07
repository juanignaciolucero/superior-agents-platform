#!/usr/bin/env python3
"""
Wallet MCP Server - Blockchain wallet tracking and portfolio analysis
Model Context Protocol (MCP) implementation for cryptocurrency wallets
Based on Superior Agents Platform existing wallet functionality
"""

import asyncio
import json
import sys
from typing import Dict, List, Any, Optional, Union
import aiohttp
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from web3 import Web3
from web3.middleware import geth_poa_middleware

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
logger = logging.getLogger("wallet-mcp")

class WalletMCPServer:
    def __init__(self):
        # Network configurations
        self.networks = {
            "ethereum": {
                "rpc_url": "https://eth-mainnet.g.alchemy.com/v2/demo",  # Demo endpoint
                "chain_id": 1,
                "explorer": "https://etherscan.io",
                "native_token": "ETH"
            },
            "polygon": {
                "rpc_url": "https://polygon-rpc.com",
                "chain_id": 137,
                "explorer": "https://polygonscan.com",
                "native_token": "MATIC"
            },
            "bsc": {
                "rpc_url": "https://bsc-dataseed1.binance.org",
                "chain_id": 56,
                "explorer": "https://bscscan.com",
                "native_token": "BNB"
            }
        }
        
        # Price API
        self.price_api = "https://api.coingecko.com/api/v3"
        
        # Common token addresses (Ethereum mainnet)
        self.common_tokens = {
            "ethereum": {
                "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                "USDC": "0xA0b86a33E6441041F66f0Fe88fE862AD5d73Ba1C",
                "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                "DAI": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
                "WBTC": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
            }
        }
        
        self.session: Optional[aiohttp.ClientSession] = None
        self.web3_connections = {}
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
    
    def get_web3_connection(self, network: str) -> Web3:
        """Get Web3 connection for specified network"""
        if network not in self.web3_connections:
            if network not in self.networks:
                raise ValueError(f"Unsupported network: {network}")
            
            rpc_url = self.networks[network]["rpc_url"]
            w3 = Web3(Web3.HTTPProvider(rpc_url))
            
            # Add PoA middleware for some networks
            if network in ["polygon", "bsc"]:
                w3.middleware_onion.inject(geth_poa_middleware, layer=0)
            
            self.web3_connections[network] = w3
            
        return self.web3_connections[network]
    
    async def _get_token_price(self, token_symbol: str) -> float:
        """Get token price from CoinGecko"""
        await self.ensure_session()
        
        # Map common symbols to CoinGecko IDs
        symbol_map = {
            "ETH": "ethereum",
            "BTC": "bitcoin", 
            "WBTC": "wrapped-bitcoin",
            "USDT": "tether",
            "USDC": "usd-coin",
            "DAI": "dai",
            "MATIC": "matic-network",
            "BNB": "binancecoin"
        }
        
        coin_id = symbol_map.get(token_symbol.upper(), token_symbol.lower())
        
        try:
            url = f"{self.price_api}/simple/price"
            params = {"ids": coin_id, "vs_currencies": "usd"}
            
            async with self.session.get(url, params=params) as response:
                response.raise_for_status()
                data = await response.json()
                
                if coin_id in data and "usd" in data[coin_id]:
                    return float(data[coin_id]["usd"])
                else:
                    logger.warning(f"Price not found for {token_symbol}")
                    return 0.0
                    
        except Exception as e:
            logger.error(f"Failed to get price for {token_symbol}: {e}")
            return 0.0
    
    async def get_wallet_balance(self, wallet_address: str, network: str = "ethereum") -> Dict:
        """Get wallet balance and token information"""
        try:
            w3 = self.get_web3_connection(network)
            
            # Validate address
            if not w3.is_address(wallet_address):
                raise ValueError(f"Invalid wallet address: {wallet_address}")
            
            wallet_address = w3.to_checksum_address(wallet_address)
            
            # Get native token balance
            native_balance = w3.eth.get_balance(wallet_address)
            native_balance_eth = w3.from_wei(native_balance, 'ether')
            
            # Get native token price
            native_token = self.networks[network]["native_token"]
            native_price = await self._get_token_price(native_token)
            native_value_usd = float(native_balance_eth) * native_price
            
            # Basic wallet info
            wallet_info = {
                "address": wallet_address,
                "network": network,
                "native_token": {
                    "symbol": native_token,
                    "balance": str(native_balance_eth),
                    "balance_wei": str(native_balance),
                    "price_usd": native_price,
                    "value_usd": native_value_usd
                },
                "total_value_usd": native_value_usd,
                "timestamp": datetime.now().isoformat()
            }
            
            # Try to get token balances (simplified - would need token contract calls)
            token_balances = []
            
            # For demo purposes, simulate some common token balances
            if network == "ethereum":
                for symbol, address in self.common_tokens["ethereum"].items():
                    # In a real implementation, you'd call the token contract
                    # For now, we'll simulate having small balances
                    simulated_balance = 0.1 if symbol in ["USDT", "USDC"] else 0.01
                    price = await self._get_token_price(symbol)
                    
                    token_balances.append({
                        "token_address": address,
                        "symbol": symbol,
                        "balance": str(simulated_balance),
                        "price_usd": price,
                        "value_usd": simulated_balance * price
                    })
            
            wallet_info["token_balances"] = token_balances
            wallet_info["total_value_usd"] += sum(t["value_usd"] for t in token_balances)
            
            return wallet_info
            
        except Exception as e:
            logger.error(f"Failed to get wallet balance: {e}")
            raise Exception(f"Failed to get wallet balance: {str(e)}")
    
    async def get_transaction_history(self, wallet_address: str, network: str = "ethereum", limit: int = 10) -> List[Dict]:
        """Get recent transaction history for wallet"""
        try:
            w3 = self.get_web3_connection(network)
            
            if not w3.is_address(wallet_address):
                raise ValueError(f"Invalid wallet address: {wallet_address}")
            
            wallet_address = w3.to_checksum_address(wallet_address)
            
            # Get latest block number
            latest_block = w3.eth.block_number
            
            transactions = []
            blocks_to_scan = min(1000, latest_block)  # Scan last 1000 blocks max
            
            # Scan recent blocks for transactions involving this address
            for block_num in range(latest_block - blocks_to_scan, latest_block + 1):
                try:
                    block = w3.eth.get_block(block_num, full_transactions=True)
                    
                    for tx in block.transactions:
                        if (tx['from'] == wallet_address or 
                            (tx['to'] and tx['to'] == wallet_address)):
                            
                            # Get transaction receipt for status
                            receipt = w3.eth.get_transaction_receipt(tx['hash'])
                            
                            tx_data = {
                                "hash": tx['hash'].hex(),
                                "block_number": block_num,
                                "from": tx['from'],
                                "to": tx['to'],
                                "value": str(w3.from_wei(tx['value'], 'ether')),
                                "value_wei": str(tx['value']),
                                "gas_used": receipt['gasUsed'],
                                "gas_price": str(tx['gasPrice']),
                                "status": "success" if receipt['status'] == 1 else "failed",
                                "timestamp": datetime.fromtimestamp(block['timestamp']).isoformat(),
                                "type": "sent" if tx['from'] == wallet_address else "received"
                            }
                            
                            transactions.append(tx_data)
                            
                            if len(transactions) >= limit:
                                break
                    
                    if len(transactions) >= limit:
                        break
                        
                except Exception as e:
                    logger.warning(f"Error scanning block {block_num}: {e}")
                    continue
            
            # Sort by block number (most recent first)
            transactions.sort(key=lambda x: x['block_number'], reverse=True)
            
            return transactions
            
        except Exception as e:
            logger.error(f"Failed to get transaction history: {e}")
            return []
    
    async def analyze_portfolio(self, wallet_address: str, network: str = "ethereum") -> Dict:
        """Analyze wallet portfolio with insights"""
        try:
            wallet_data = await self.get_wallet_balance(wallet_address, network)
            transactions = await self.get_transaction_history(wallet_address, network, limit=20)
            
            # Calculate portfolio metrics
            total_value = wallet_data["total_value_usd"]
            native_value = wallet_data["native_token"]["value_usd"]
            token_value = sum(t["value_usd"] for t in wallet_data["token_balances"])
            
            # Portfolio distribution
            distribution = {
                "native_token_percentage": (native_value / total_value * 100) if total_value > 0 else 0,
                "tokens_percentage": (token_value / total_value * 100) if total_value > 0 else 0
            }
            
            # Transaction analysis
            sent_txs = [tx for tx in transactions if tx["type"] == "sent"]
            received_txs = [tx for tx in transactions if tx["type"] == "received"]
            
            activity_analysis = {
                "total_transactions": len(transactions),
                "sent_transactions": len(sent_txs),
                "received_transactions": len(received_txs),
                "transaction_frequency": "active" if len(transactions) > 5 else "low",
                "latest_activity": transactions[0]["timestamp"] if transactions else None
            }
            
            # Risk assessment (simplified)
            risk_factors = []
            if distribution["native_token_percentage"] > 80:
                risk_factors.append("High concentration in native token")
            if total_value > 100000:
                risk_factors.append("High value wallet - consider security measures")
            if len(transactions) > 50:
                risk_factors.append("High activity wallet")
            
            portfolio_analysis = {
                "wallet_address": wallet_address,
                "network": network,
                "total_value_usd": total_value,
                "distribution": distribution,
                "activity": activity_analysis,
                "risk_factors": risk_factors,
                "token_count": len(wallet_data["token_balances"]),
                "diversification_score": min(100, len(wallet_data["token_balances"]) * 10),  # Simple score
                "timestamp": datetime.now().isoformat()
            }
            
            return portfolio_analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze portfolio: {e}")
            raise Exception(f"Failed to analyze portfolio: {str(e)}")

# Create server instance
server = Server("wallet-mcp")
wallet_server = WalletMCPServer()

@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """List available resources"""
    return [
        Resource(
            uri="wallet://networks",
            name="Supported Networks",
            description="List of supported blockchain networks",
            mimeType="application/json"
        ),
        Resource(
            uri="wallet://tokens/common",
            name="Common Tokens",
            description="List of commonly tracked tokens",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """Read resource content"""
    if uri == "wallet://networks":
        networks = {
            "supported_networks": list(wallet_server.networks.keys()),
            "network_details": wallet_server.networks
        }
        return json.dumps(networks, indent=2)
    
    elif uri == "wallet://tokens/common":
        return json.dumps(wallet_server.common_tokens, indent=2)
    
    else:
        raise ValueError(f"Unknown resource: {uri}")

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools"""
    return [
        Tool(
            name="get_balance",
            description="Get current balance for a wallet address",
            inputSchema={
                "type": "object",
                "properties": {
                    "wallet_address": {
                        "type": "string",
                        "description": "Ethereum wallet address (0x...)"
                    },
                    "network": {
                        "type": "string",
                        "description": "Blockchain network (ethereum, polygon, bsc)",
                        "default": "ethereum"
                    }
                },
                "required": ["wallet_address"]
            }
        ),
        Tool(
            name="get_transactions",
            description="Retrieve transaction history for a wallet",
            inputSchema={
                "type": "object",
                "properties": {
                    "wallet_address": {
                        "type": "string",
                        "description": "Ethereum wallet address (0x...)"
                    },
                    "network": {
                        "type": "string",
                        "description": "Blockchain network (ethereum, polygon, bsc)",
                        "default": "ethereum"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of transactions to return (default: 10)",
                        "default": 10,
                        "maximum": 50
                    }
                },
                "required": ["wallet_address"]
            }
        ),
        Tool(
            name="watch_address",
            description="Monitor an address for new transactions (returns current status)",
            inputSchema={
                "type": "object",
                "properties": {
                    "wallet_address": {
                        "type": "string",
                        "description": "Ethereum wallet address to monitor"
                    },
                    "network": {
                        "type": "string",
                        "description": "Blockchain network",
                        "default": "ethereum"
                    }
                },
                "required": ["wallet_address"]
            }
        ),
        Tool(
            name="get_portfolio_value",
            description="Calculate total portfolio value and analysis",
            inputSchema={
                "type": "object",
                "properties": {
                    "wallet_address": {
                        "type": "string",
                        "description": "Ethereum wallet address"
                    },
                    "network": {
                        "type": "string",
                        "description": "Blockchain network",
                        "default": "ethereum"
                    }
                },
                "required": ["wallet_address"]
            }
        ),
        Tool(
            name="validate_address",
            description="Validate if an address is a valid wallet address",
            inputSchema={
                "type": "object",
                "properties": {
                    "address": {
                        "type": "string",
                        "description": "Address to validate"
                    },
                    "network": {
                        "type": "string",
                        "description": "Blockchain network",
                        "default": "ethereum"
                    }
                },
                "required": ["address"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
    """Handle tool calls"""
    
    try:
        if name == "get_balance":
            wallet_address = arguments.get("wallet_address")
            network = arguments.get("network", "ethereum")
            
            balance_data = await wallet_server.get_wallet_balance(wallet_address, network)
            
            return [types.TextContent(
                type="text",
                text=json.dumps(balance_data, indent=2)
            )]
        
        elif name == "get_transactions":
            wallet_address = arguments.get("wallet_address")
            network = arguments.get("network", "ethereum")
            limit = arguments.get("limit", 10)
            
            transactions = await wallet_server.get_transaction_history(wallet_address, network, limit)
            
            result = {
                "wallet_address": wallet_address,
                "network": network,
                "transactions": transactions,
                "count": len(transactions),
                "timestamp": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "watch_address":
            wallet_address = arguments.get("wallet_address")
            network = arguments.get("network", "ethereum")
            
            # For now, return current status (in a real implementation, this would set up monitoring)
            balance_data = await wallet_server.get_wallet_balance(wallet_address, network)
            recent_txs = await wallet_server.get_transaction_history(wallet_address, network, limit=5)
            
            watch_status = {
                "wallet_address": wallet_address,
                "network": network,
                "status": "monitoring_active",
                "current_balance": balance_data["total_value_usd"],
                "recent_transactions": len(recent_txs),
                "last_activity": recent_txs[0]["timestamp"] if recent_txs else "No recent activity",
                "monitoring_since": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(watch_status, indent=2)
            )]
        
        elif name == "get_portfolio_value":
            wallet_address = arguments.get("wallet_address")
            network = arguments.get("network", "ethereum")
            
            portfolio_analysis = await wallet_server.analyze_portfolio(wallet_address, network)
            
            return [types.TextContent(
                type="text",
                text=json.dumps(portfolio_analysis, indent=2)
            )]
        
        elif name == "validate_address":
            address = arguments.get("address")
            network = arguments.get("network", "ethereum")
            
            try:
                w3 = wallet_server.get_web3_connection(network)
                is_valid = w3.is_address(address)
                
                if is_valid:
                    checksum_address = w3.to_checksum_address(address)
                else:
                    checksum_address = None
                
                validation_result = {
                    "address": address,
                    "is_valid": is_valid,
                    "checksum_address": checksum_address,
                    "network": network,
                    "timestamp": datetime.now().isoformat()
                }
                
                return [types.TextContent(
                    type="text",
                    text=json.dumps(validation_result, indent=2)
                )]
                
            except Exception as e:
                return [types.TextContent(
                    type="text",
                    text=json.dumps({
                        "address": address,
                        "is_valid": False,
                        "error": str(e)
                    }, indent=2)
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
        await wallet_server.close()

if __name__ == "__main__":
    asyncio.run(main())