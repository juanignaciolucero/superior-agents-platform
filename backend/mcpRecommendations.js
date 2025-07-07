// MCP Recommendation Engine
// Analyzes agent prompts and suggests relevant MCPs

const { getMCPById } = require('./mcpCatalog');

// Keywords and patterns for different use cases
const USE_CASE_PATTERNS = {
  trading: {
    keywords: [
      'trading', 'trade', 'buy', 'sell', 'exchange', 'swap', 'dex',
      'profit', 'loss', 'strategy', 'technical analysis', 'chart',
      'market maker', 'arbitrage', 'portfolio management', 'bot',
      'trader', 'algorithm', 'automated', 'crypto', 'bitcoin', 'eth'
    ],
    phrases: [
      'execute trades', 'trading strategy', 'buy and sell',
      'market analysis', 'profit optimization', 'risk management',
      'trading bot', 'crypto bot', 'automated trading', 'bot for trading'
    ],
    suggestedMCPs: ['wallet-tracker', 'price-feed', 'news-aggregator'],
    confidence: 0.9
  },
  
  portfolio: {
    keywords: [
      'portfolio', 'balance', 'wallet', 'holdings', 'assets',
      'diversification', 'allocation', 'investment', 'track',
      'monitor', 'value', 'performance'
    ],
    phrases: [
      'track portfolio', 'monitor wallet', 'balance analysis',
      'asset allocation', 'portfolio performance', 'investment tracking'
    ],
    suggestedMCPs: ['wallet-tracker', 'price-feed'],
    confidence: 0.85
  },
  
  market_analysis: {
    keywords: [
      'market', 'price', 'analysis', 'trend', 'forecast',
      'prediction', 'research', 'data', 'statistics',
      'volatility', 'sentiment', 'indicators'
    ],
    phrases: [
      'market analysis', 'price prediction', 'trend analysis',
      'market research', 'sentiment analysis', 'market data'
    ],
    suggestedMCPs: ['price-feed', 'news-aggregator'],
    confidence: 0.8
  },
  
  news_monitoring: {
    keywords: [
      'news', 'events', 'announcements', 'updates', 'alerts',
      'breaking', 'developments', 'regulation', 'adoption',
      'partnership', 'launch', 'release'
    ],
    phrases: [
      'track news', 'monitor events', 'news analysis',
      'market news', 'breaking news', 'news alerts'
    ],
    suggestedMCPs: ['news-aggregator'],
    confidence: 0.75
  },
  
  price_tracking: {
    keywords: [
      'price', 'cost', 'value', 'rate', 'quote', 'ticker',
      'historical', 'current', 'real-time', 'live',
      'high', 'low', 'change', 'percentage'
    ],
    phrases: [
      'track prices', 'price monitoring', 'price alerts',
      'current prices', 'price changes', 'price data'
    ],
    suggestedMCPs: ['price-feed'],
    confidence: 0.7
  },
  
  wallet_monitoring: {
    keywords: [
      'wallet', 'address', 'transaction', 'transfer', 'balance',
      'ethereum', 'bitcoin', 'crypto', 'blockchain',
      'metamask', 'ledger', 'hardware wallet'
    ],
    phrases: [
      'wallet monitoring', 'track transactions', 'wallet analysis',
      'address tracking', 'transaction history', 'wallet balance'
    ],
    suggestedMCPs: ['wallet-tracker'],
    confidence: 0.8
  }
};

// Cryptocurrency specific patterns
const CRYPTO_PATTERNS = {
  bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning'],
  ethereum: ['ethereum', 'eth', 'erc20', 'smart contract', 'defi'],
  defi: ['defi', 'yield', 'liquidity', 'staking', 'lending', 'borrowing'],
  nft: ['nft', 'collectible', 'art', 'opensea', 'metadata'],
  gaming: ['gaming', 'play to earn', 'p2e', 'metaverse', 'virtual'],
  meme: ['meme', 'shiba', 'doge', 'pepe', 'community driven']
};

class MCPRecommendationEngine {
  constructor() {
    this.patterns = USE_CASE_PATTERNS;
    this.cryptoPatterns = CRYPTO_PATTERNS;
  }

  /**
   * Analyze agent configuration and recommend MCPs
   */
  analyzePurpose(name, description, prompt) {
    const combinedText = `${name} ${description} ${prompt}`.toLowerCase();
    
    console.log(`🔎 Analyzing text: "${combinedText}"`);
    
    const analysis = {
      detectedUseCases: [],
      suggestedMCPs: [],
      confidence: 0,
      reasoning: []
    };

    // Analyze each use case pattern
    for (const [useCase, pattern] of Object.entries(this.patterns)) {
      const score = this.calculatePatternScore(combinedText, pattern);
      
      console.log(`🔍 ${useCase}: score=${score.toFixed(3)} (threshold=0.1)`);
      
      if (score > 0.1) { // Lower threshold for detection
        console.log(`✅ ${useCase} detected with score ${score.toFixed(3)}`);
        analysis.detectedUseCases.push({
          useCase,
          score,
          confidence: pattern.confidence * score
        });
      }
    }

    // Sort by confidence and get top suggestions
    analysis.detectedUseCases.sort((a, b) => b.confidence - a.confidence);

    // Collect unique MCP suggestions
    const mcpSuggestions = new Map();
    
    for (const detection of analysis.detectedUseCases) {
      const pattern = this.patterns[detection.useCase];
      
      for (const mcpId of pattern.suggestedMCPs) {
        if (!mcpSuggestions.has(mcpId)) {
          const mcp = getMCPById(mcpId);
          if (mcp) {
            mcpSuggestions.set(mcpId, {
              ...mcp,
              confidence: detection.confidence,
              reason: this.generateReason(detection.useCase, mcpId),
              suggested: true
            });
          }
        } else {
          // Increase confidence if multiple use cases suggest the same MCP
          const existing = mcpSuggestions.get(mcpId);
          existing.confidence = Math.min(1.0, existing.confidence + detection.confidence * 0.3);
        }
      }
    }

    // Convert to array and sort by confidence
    analysis.suggestedMCPs = Array.from(mcpSuggestions.values())
      .sort((a, b) => b.confidence - a.confidence);

    // Calculate overall confidence
    analysis.confidence = analysis.suggestedMCPs.length > 0 
      ? analysis.suggestedMCPs[0].confidence 
      : 0;

    // Generate reasoning
    analysis.reasoning = this.generateReasoningText(analysis);

    return analysis;
  }

  /**
   * Calculate how well text matches a pattern
   */
  calculatePatternScore(text, pattern) {
    let score = 0;
    let totalMatches = 0;
    let matchedKeywords = [];
    let matchedPhrases = [];
    
    // Check keywords with partial matching
    for (const keyword of pattern.keywords) {
      if (text.includes(keyword)) {
        score += 1;
        totalMatches += 1;
        matchedKeywords.push(keyword);
      }
    }

    // Check phrases (higher weight) with partial matching
    for (const phrase of pattern.phrases) {
      if (text.includes(phrase)) {
        score += 2;
        totalMatches += 1;
        matchedPhrases.push(phrase);
      }
    }

    // If we have at least one match, calculate confidence
    if (totalMatches > 0) {
      // Base score from matches, bonus for multiple matches
      const baseScore = Math.min(1.0, totalMatches * 0.3);
      const bonusScore = totalMatches > 1 ? 0.2 : 0;
      const finalScore = Math.min(1.0, baseScore + bonusScore);
      
      console.log(`    Matched keywords: [${matchedKeywords.join(', ')}]`);
      console.log(`    Matched phrases: [${matchedPhrases.join(', ')}]`);
      console.log(`    Total matches: ${totalMatches}, Final score: ${finalScore.toFixed(3)}`);
      
      return finalScore;
    }
    
    return 0;
  }

  /**
   * Generate reason why an MCP is suggested
   */
  generateReason(useCase, mcpId) {
    const reasons = {
      'wallet-tracker': {
        trading: 'Monitor wallet balances and track trading performance',
        portfolio: 'Track portfolio value and asset distribution',
        wallet_monitoring: 'Monitor wallet transactions and balances'
      },
      'price-feed': {
        trading: 'Get real-time prices for trading decisions',
        market_analysis: 'Access current and historical price data',
        price_tracking: 'Track cryptocurrency prices and changes',
        portfolio: 'Calculate portfolio values with current prices'
      },
      'news-aggregator': {
        trading: 'Stay informed about market-moving news',
        market_analysis: 'Analyze market sentiment from news',
        news_monitoring: 'Monitor cryptocurrency news and events'
      }
    };

    return reasons[mcpId]?.[useCase] || `Recommended for ${useCase} functionality`;
  }

  /**
   * Generate human-readable reasoning text
   */
  generateReasoningText(analysis) {
    if (analysis.detectedUseCases.length === 0) {
      return ['No specific use case detected. All MCPs are available for selection.'];
    }

    const reasoning = [];
    const topUseCase = analysis.detectedUseCases[0];
    
    reasoning.push(
      `Detected primary use case: ${topUseCase.useCase.replace('_', ' ')} ` +
      `(${Math.round(topUseCase.confidence * 100)}% confidence)`
    );

    if (analysis.suggestedMCPs.length > 0) {
      reasoning.push(
        `Recommended ${analysis.suggestedMCPs.length} MCP(s) for this use case:`
      );
      
      for (const mcp of analysis.suggestedMCPs.slice(0, 3)) { // Top 3
        reasoning.push(`• ${mcp.name}: ${mcp.reason}`);
      }
    }

    return reasoning;
  }

  /**
   * Get all available MCPs with recommendation status
   */
  getAllMCPsWithRecommendations(analysis) {
    const { getMCPsByCategory } = require('./mcpCatalog');
    const allMCPs = getMCPsByCategory(); // Get all MCPs
    
    const suggestedIds = new Set(analysis.suggestedMCPs.map(mcp => mcp.id));
    
    return allMCPs.map(mcp => ({
      ...mcp,
      suggested: suggestedIds.has(mcp.id),
      confidence: analysis.suggestedMCPs.find(s => s.id === mcp.id)?.confidence || 0,
      reason: analysis.suggestedMCPs.find(s => s.id === mcp.id)?.reason || null
    }));
  }
}

// Create singleton instance
const recommendationEngine = new MCPRecommendationEngine();

module.exports = {
  MCPRecommendationEngine,
  recommendationEngine,
  USE_CASE_PATTERNS
};