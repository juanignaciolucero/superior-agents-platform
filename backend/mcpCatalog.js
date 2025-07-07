// MCP (Model Context Protocol) Catalog
// This defines all available MCP servers that can be used by agents

const MCP_CATALOG = [
  {
    id: 'wallet-tracker',
    name: 'Wallet Tracker MCP',
    description: 'Monitor wallet balances, transactions, and portfolio performance',
    category: 'blockchain',
    icon: '💰',
    serverPath: '../mcps/wallet-mcp/server.py',
    transport: 'stdio',
    tools: [
      {
        name: 'get_balance',
        description: 'Get current balance for a wallet address'
      },
      {
        name: 'get_transactions',
        description: 'Retrieve transaction history for a wallet'
      },
      {
        name: 'watch_address',
        description: 'Monitor an address for new transactions'
      },
      {
        name: 'get_portfolio_value',
        description: 'Calculate total portfolio value in USD'
      }
    ],
    config: {
      networks: ['ethereum', 'solana', 'polygon'],
      requiredEnvVars: ['ETH_RPC_URL'],
      optionalEnvVars: ['SOL_RPC_URL', 'ETHERSCAN_API_KEY'],
      configFields: [
        {
          key: 'ETH_RPC_URL',
          label: 'Ethereum RPC URL',
          type: 'url',
          required: true,
          description: 'Ethereum node RPC endpoint (e.g., Infura, Alchemy)',
          placeholder: 'https://mainnet.infura.io/v3/your-project-id',
        },
        {
          key: 'SOL_RPC_URL', 
          label: 'Solana RPC URL (Optional)',
          type: 'url',
          required: false,
          description: 'Solana node RPC endpoint - only needed if monitoring Solana wallets',
          placeholder: 'https://api.mainnet-beta.solana.com',
        },
        {
          key: 'ETHERSCAN_API_KEY',
          label: 'Etherscan API Key',
          type: 'text',
          required: false,
          description: 'API key for enhanced Ethereum data (optional)',
          placeholder: 'Your Etherscan API key'
        },
        {
          key: 'WALLET_ADDRESSES',
          label: 'Ethereum Wallet Addresses to Monitor',
          type: 'textarea',
          required: true,
          description: 'Comma-separated list of Ethereum wallet addresses to track',
          placeholder: '0x742d35...abc123,\n0x456def...789xyz',
        },
        {
          key: 'SOL_WALLET_ADDRESSES',
          label: 'Solana Wallet Addresses (Optional)',
          type: 'textarea',
          required: false,
          description: 'Comma-separated list of Solana wallet addresses to track (only if using Solana)',
          placeholder: 'ABC123...xyz789,\nDEF456...uvw012',
        }
      ]
    },
    pricing: 'free',
    reliability: 'high'
  },
  
  {
    id: 'price-feed',
    name: 'Price Feed MCP',
    description: 'Real-time cryptocurrency prices and market data',
    category: 'market-data',
    icon: '📈',
    serverPath: '../mcps/price-mcp/server.py',
    transport: 'stdio',
    tools: [
      {
        name: 'get_price',
        description: 'Get current price for any cryptocurrency'
      },
      {
        name: 'get_historical_prices',
        description: 'Retrieve historical price data'
      },
      {
        name: 'subscribe_price_updates',
        description: 'Subscribe to real-time price updates'
      },
      {
        name: 'get_market_cap',
        description: 'Get market capitalization data'
      },
      {
        name: 'get_trading_volume',
        description: 'Get 24h trading volume data'
      }
    ],
    config: {
      sources: ['coingecko', 'binance', 'coinbase'],
      updateInterval: 5000,
      requiredEnvVars: ['COINGECKO_API_KEY'],
      optionalEnvVars: ['BINANCE_API_KEY', 'COINBASE_API_KEY'],
      configFields: [
        {
          key: 'COINGECKO_API_KEY',
          label: 'CoinGecko API Key',
          type: 'text',
          required: true,
          description: 'API key from CoinGecko for price data access. Get one free at coingecko.com/api',
          placeholder: 'CG-xxxxxxxxxxxxxxxxxxxx (or any valid API key)',
        },
        {
          key: 'BINANCE_API_KEY',
          label: 'Binance API Key',
          type: 'text',
          required: false,
          description: 'Optional Binance API key for additional price sources',
          placeholder: 'Your Binance API key'
        },
        {
          key: 'COINBASE_API_KEY',
          label: 'Coinbase API Key',
          type: 'text',
          required: false,
          description: 'Optional Coinbase API key for additional price sources',
          placeholder: 'Your Coinbase API key'
        },
        {
          key: 'UPDATE_INTERVAL',
          label: 'Update Interval (ms)',
          type: 'number',
          required: false,
          description: 'How often to update prices in milliseconds',
          placeholder: '5000',
          defaultValue: 5000,
        }
      ]
    },
    pricing: 'freemium',
    reliability: 'high'
  },

  // Commented out - no real implementation yet
  /*{
    id: 'social-sentiment',
    name: 'Social Sentiment MCP',
    description: 'Track social media sentiment and trending topics',
    category: 'social-data',
    icon: '📱',
    dockerImage: 'superior-agents/social-mcp:latest',
    transport: 'stdio',
    tools: [
      {
        name: 'get_twitter_sentiment',
        description: 'Analyze Twitter sentiment for a cryptocurrency'
      },
      {
        name: 'get_reddit_discussion',
        description: 'Get Reddit discussions and sentiment'
      },
      {
        name: 'get_trending_topics',
        description: 'Get currently trending crypto topics'
      },
      {
        name: 'analyze_influencer_posts',
        description: 'Analyze posts from crypto influencers'
      }
    ],
    config: {
      platforms: ['twitter', 'reddit', 'telegram'],
      requiredEnvVars: ['TWITTER_BEARER_TOKEN', 'REDDIT_CLIENT_ID'],
      optionalEnvVars: ['TELEGRAM_BOT_TOKEN']
    },
    pricing: 'paid',
    reliability: 'medium'
  },*/

  {
    id: 'news-aggregator',
    name: 'News Aggregator MCP',
    description: 'Aggregate and analyze cryptocurrency news from multiple sources',
    category: 'news',
    icon: '📰',
    serverPath: '../mcps/news-mcp/server.py',
    transport: 'stdio',
    tools: [
      {
        name: 'get_latest_news',
        description: 'Get latest cryptocurrency news'
      },
      {
        name: 'search_news',
        description: 'Search news by keyword or cryptocurrency'
      },
      {
        name: 'analyze_news_sentiment',
        description: 'Analyze sentiment of news articles'
      },
      {
        name: 'get_breaking_news',
        description: 'Get breaking news alerts'
      }
    ],
    config: {
      sources: ['coindesk', 'cointelegraph', 'decrypt', 'theblock'],
      languages: ['en', 'es', 'zh'],
      requiredEnvVars: [],
      optionalEnvVars: ['NEWS_API_KEY'],
      configFields: [
        {
          key: 'NEWS_API_KEY',
          label: 'News API Key',
          type: 'text',
          required: false,
          description: 'Optional API key for enhanced news access and higher rate limits',
          placeholder: 'Your News API key'
        },
        {
          key: 'PREFERRED_SOURCES',
          label: 'Preferred News Sources',
          type: 'multiselect',
          required: false,
          description: 'Select which news sources to prioritize',
          options: ['coindesk', 'cointelegraph', 'decrypt', 'theblock', 'bitcoinmagazine', 'cryptopotato'],
          defaultValue: ['coindesk', 'cointelegraph']
        },
        {
          key: 'LANGUAGE_PREFERENCE',
          label: 'Language Preference',
          type: 'select',
          required: false,
          description: 'Preferred language for news articles',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' }, 
            { value: 'zh', label: 'Chinese' }
          ],
          defaultValue: 'en'
        }
      ]
    },
    pricing: 'free',
    reliability: 'high'
  },

  // Commented out - no real implementation yet
  /*{
    id: 'defi-protocols',
    name: 'DeFi Protocols MCP',
    description: 'Interact with DeFi protocols and get yield farming data',
    category: 'defi',
    icon: '🏦',
    dockerImage: 'superior-agents/defi-mcp:latest',
    transport: 'stdio',
    tools: [
      {
        name: 'get_pool_info',
        description: 'Get information about liquidity pools'
      },
      {
        name: 'get_yield_rates',
        description: 'Get current yield farming rates'
      },
      {
        name: 'calculate_impermanent_loss',
        description: 'Calculate potential impermanent loss'
      },
      {
        name: 'get_protocol_tvl',
        description: 'Get Total Value Locked in protocols'
      }
    ],
    config: {
      protocols: ['uniswap', 'compound', 'aave', 'curve'],
      networks: ['ethereum', 'polygon', 'arbitrum'],
      requiredEnvVars: ['ETH_RPC_URL'],
      optionalEnvVars: ['DEFIPULSE_API_KEY']
    },
    pricing: 'freemium',
    reliability: 'medium'
  },*/

  // Commented out - no real implementation yet  
  /*{
    id: 'technical-analysis',
    name: 'Technical Analysis MCP',
    description: 'Perform technical analysis on cryptocurrency charts',
    category: 'analysis',
    icon: '📊',
    dockerImage: 'superior-agents/ta-mcp:latest',
    transport: 'stdio',
    tools: [
      {
        name: 'calculate_rsi',
        description: 'Calculate Relative Strength Index'
      },
      {
        name: 'calculate_macd',
        description: 'Calculate MACD indicator'
      },
      {
        name: 'detect_patterns',
        description: 'Detect chart patterns (head & shoulders, triangles, etc.)'
      },
      {
        name: 'calculate_support_resistance',
        description: 'Calculate support and resistance levels'
      },
      {
        name: 'generate_signals',
        description: 'Generate buy/sell signals based on multiple indicators'
      }
    ],
    config: {
      indicators: ['rsi', 'macd', 'bollinger', 'ema', 'sma'],
      timeframes: ['1m', '5m', '15m', '1h', '4h', '1d'],
      requiredEnvVars: [],
      optionalEnvVars: []
    },
    pricing: 'free',
    reliability: 'high'
  },*/

  // Commented out - no real implementation yet
  /*{
    id: 'trading-executor',
    name: 'Trading Executor MCP',
    description: 'Execute trades on supported exchanges',
    category: 'trading',
    icon: '⚡',
    dockerImage: 'superior-agents/trading-mcp:latest',
    transport: 'stdio',
    tools: [
      {
        name: 'place_order',
        description: 'Place buy/sell orders on exchanges'
      },
      {
        name: 'cancel_order',
        description: 'Cancel existing orders'
      },
      {
        name: 'get_order_book',
        description: 'Get current order book data'
      },
      {
        name: 'get_account_balance',
        description: 'Get trading account balance'
      },
      {
        name: 'set_stop_loss',
        description: 'Set stop-loss orders'
      }
    ],
    config: {
      exchanges: ['binance', 'coinbase', 'kraken'],
      orderTypes: ['market', 'limit', 'stop-loss', 'take-profit'],
      requiredEnvVars: ['EXCHANGE_API_KEY', 'EXCHANGE_SECRET'],
      optionalEnvVars: ['EXCHANGE_PASSPHRASE']
    },
    pricing: 'paid',
    reliability: 'high',
    riskLevel: 'high'
  }*/
];

// Helper functions
function getMCPsByCategory(category) {
  // Filter out commented MCPs and only return valid ones
  const validMCPs = MCP_CATALOG.filter(mcp => mcp && mcp.id && mcp.name);
  return category ? validMCPs.filter(mcp => mcp.category === category) : validMCPs;
}

function getMCPById(id) {
  return MCP_CATALOG.find(mcp => mcp.id === id);
}

function getAvailableCategories() {
  return [...new Set(MCP_CATALOG.map(mcp => mcp.category))];
}

function generateMCPToolsDescription(mcpIds) {
  const selectedMCPs = mcpIds.map(id => getMCPById(id)).filter(Boolean);
  
  let description = "AVAILABLE TOOLS:\n\n";
  
  selectedMCPs.forEach(mcp => {
    description += `${mcp.icon} ${mcp.name}:\n`;
    description += `${mcp.description}\n`;
    description += "Tools:\n";
    
    mcp.tools.forEach(tool => {
      description += `  - ${tool.name}(): ${tool.description}\n`;
    });
    
    description += "\n";
  });
  
  description += "Use these tools to gather real-time data for your analysis and decision making.\n";
  description += "Always call the appropriate tool functions to get current information before making recommendations.\n";
  
  return description;
}

module.exports = {
  MCP_CATALOG,
  getMCPsByCategory,
  getMCPById,
  getAvailableCategories,
  generateMCPToolsDescription
};