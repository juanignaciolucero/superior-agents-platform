#!/usr/bin/env python3
"""
News MCP Server - Cryptocurrency news aggregation
Model Context Protocol (MCP) implementation for cryptocurrency news
"""

import asyncio
import json
import sys
from typing import Dict, List, Any, Optional
import aiohttp
from datetime import datetime, timedelta
import logging
import feedparser
import re

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
logger = logging.getLogger("news-mcp")

class NewsMCPServer:
    def __init__(self):
        # RSS feeds for major crypto news sources
        self.news_sources = {
            "coindesk": "https://feeds.coindesk.com/rss",
            "cointelegraph": "https://cointelegraph.com/rss",
            "decrypt": "https://decrypt.co/feed",
            "theblock": "https://www.theblock.co/rss.xml",
            "bitcoinmagazine": "https://bitcoinmagazine.com/.rss/full/"
        }
        
        # Alternative API sources (free tier)
        self.api_sources = {
            "newsapi": "https://newsapi.org/v2/everything",
            "gnews": "https://gnews.io/api/v4/search"
        }
        
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache = {}
        self.cache_ttl = 1800  # 30 minutes cache for news
        
    async def ensure_session(self):
        """Ensure aiohttp session exists"""
        if not self.session:
            self.session = aiohttp.ClientSession()
    
    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
    
    def _clean_text(self, text: str) -> str:
        """Clean HTML and extra whitespace from text"""
        if not text:
            return ""
        
        # Remove HTML tags
        clean = re.compile('<.*?>')
        text = re.sub(clean, '', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    async def _fetch_rss_feed(self, source: str, url: str) -> List[Dict]:
        """Fetch and parse RSS feed"""
        try:
            await self.ensure_session()
            
            async with self.session.get(url) as response:
                response.raise_for_status()
                content = await response.text()
                
            feed = feedparser.parse(content)
            articles = []
            
            for entry in feed.entries[:10]:  # Limit to 10 most recent
                pub_date = getattr(entry, 'published_parsed', None)
                if pub_date:
                    pub_date = datetime(*pub_date[:6]).isoformat()
                else:
                    pub_date = datetime.now().isoformat()
                
                article = {
                    "title": self._clean_text(getattr(entry, 'title', '')),
                    "description": self._clean_text(getattr(entry, 'summary', '')),
                    "url": getattr(entry, 'link', ''),
                    "published": pub_date,
                    "source": source,
                    "author": getattr(entry, 'author', 'Unknown')
                }
                articles.append(article)
                
            logger.info(f"Fetched {len(articles)} articles from {source}")
            return articles
            
        except Exception as e:
            logger.error(f"Failed to fetch RSS from {source}: {e}")
            return []
    
    async def _search_crypto_keywords(self, articles: List[Dict], keywords: List[str]) -> List[Dict]:
        """Filter articles by crypto-related keywords"""
        if not keywords:
            return articles
        
        filtered = []
        keyword_pattern = '|'.join([re.escape(k.lower()) for k in keywords])
        
        for article in articles:
            title_lower = article.get('title', '').lower()
            desc_lower = article.get('description', '').lower()
            
            if re.search(keyword_pattern, title_lower) or re.search(keyword_pattern, desc_lower):
                # Add matched keywords
                matched = []
                for keyword in keywords:
                    if keyword.lower() in title_lower or keyword.lower() in desc_lower:
                        matched.append(keyword)
                article['matched_keywords'] = matched
                filtered.append(article)
        
        return filtered
    
    async def get_latest_news(self, limit: int = 20, sources: List[str] = None) -> List[Dict]:
        """Get latest crypto news from all sources"""
        cache_key = f"latest_news:{limit}:{json.dumps(sources or [], sort_keys=True)}"
        now = datetime.now()
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (now - timestamp).seconds < self.cache_ttl:
                logger.info("Cache hit for latest news")
                return cached_data
        
        all_articles = []
        sources_to_use = sources or list(self.news_sources.keys())
        
        # Fetch from RSS sources
        tasks = []
        for source in sources_to_use:
            if source in self.news_sources:
                tasks.append(self._fetch_rss_feed(source, self.news_sources[source]))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)
        
        # Sort by publication date (most recent first)
        all_articles.sort(
            key=lambda x: datetime.fromisoformat(x['published']), 
            reverse=True
        )
        
        # Limit results
        limited_articles = all_articles[:limit]
        
        # Cache results
        self.cache[cache_key] = (limited_articles, now)
        
        return limited_articles

# Create server instance
server = Server("news-mcp")
news_server = NewsMCPServer()

@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """List available resources"""
    return [
        Resource(
            uri="news://crypto/latest",
            name="Latest Crypto News",
            description="Latest cryptocurrency news from multiple sources",
            mimeType="application/json"
        ),
        Resource(
            uri="news://crypto/sources",
            name="News Sources",
            description="Available cryptocurrency news sources",
            mimeType="application/json"
        )
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """Read resource content"""
    if uri == "news://crypto/latest":
        articles = await news_server.get_latest_news(limit=15)
        return json.dumps(articles, indent=2)
    
    elif uri == "news://crypto/sources":
        sources = {
            "rss_sources": list(news_server.news_sources.keys()),
            "total_sources": len(news_server.news_sources)
        }
        return json.dumps(sources, indent=2)
    
    else:
        raise ValueError(f"Unknown resource: {uri}")

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools"""
    return [
        Tool(
            name="get_latest_news",
            description="Get latest cryptocurrency news articles",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of articles to return (default: 10)",
                        "default": 10,
                        "minimum": 1,
                        "maximum": 50
                    },
                    "sources": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Specific news sources to fetch from"
                    }
                }
            }
        ),
        Tool(
            name="search_news",
            description="Search news articles by keywords",
            inputSchema={
                "type": "object",
                "properties": {
                    "keywords": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Keywords to search for (e.g., ['bitcoin', 'ethereum'])"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of articles to return (default: 10)",
                        "default": 10
                    }
                },
                "required": ["keywords"]
            }
        ),
        Tool(
            name="get_breaking_news",
            description="Get recent breaking news (last 6 hours)",
            inputSchema={
                "type": "object",
                "properties": {
                    "urgent_keywords": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Keywords that indicate breaking news",
                        "default": ["breaking", "urgent", "alert", "crash", "surge", "SEC", "ban", "approval"]
                    }
                }
            }
        ),
        Tool(
            name="analyze_sentiment",
            description="Analyze sentiment of recent news headlines",
            inputSchema={
                "type": "object",
                "properties": {
                    "cryptocurrency": {
                        "type": "string",
                        "description": "Specific cryptocurrency to analyze (e.g., 'bitcoin')"
                    },
                    "limit": {
                        "type": "integer", 
                        "description": "Number of articles to analyze (default: 20)",
                        "default": 20
                    }
                }
            }
        ),
        Tool(
            name="get_sources",
            description="Get available news sources",
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
        if name == "get_latest_news":
            limit = arguments.get("limit", 10)
            sources = arguments.get("sources")
            
            articles = await news_server.get_latest_news(limit=limit, sources=sources)
            
            result = {
                "articles": articles,
                "count": len(articles),
                "sources_used": sources or list(news_server.news_sources.keys()),
                "timestamp": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "search_news":
            keywords = arguments.get("keywords", [])
            limit = arguments.get("limit", 10)
            
            # Get latest news first
            all_articles = await news_server.get_latest_news(limit=50)
            
            # Filter by keywords
            filtered_articles = await news_server._search_crypto_keywords(all_articles, keywords)
            
            # Limit results
            limited_articles = filtered_articles[:limit]
            
            result = {
                "search_keywords": keywords,
                "articles": limited_articles,
                "found": len(limited_articles),
                "searched_total": len(all_articles),
                "timestamp": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "get_breaking_news":
            urgent_keywords = arguments.get("urgent_keywords", [
                "breaking", "urgent", "alert", "crash", "surge", "SEC", "ban", "approval"
            ])
            
            # Get recent news (last 6 hours)
            recent_cutoff = datetime.now() - timedelta(hours=6)
            all_articles = await news_server.get_latest_news(limit=30)
            
            # Filter by time and urgent keywords
            breaking_news = []
            for article in all_articles:
                pub_date = datetime.fromisoformat(article['published'])
                if pub_date > recent_cutoff:
                    # Check for urgent keywords
                    title_lower = article.get('title', '').lower()
                    for keyword in urgent_keywords:
                        if keyword.lower() in title_lower:
                            article['urgency_keyword'] = keyword
                            breaking_news.append(article)
                            break
            
            result = {
                "breaking_news": breaking_news,
                "count": len(breaking_news),
                "time_window": "6 hours",
                "urgent_keywords": urgent_keywords,
                "timestamp": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "analyze_sentiment":
            cryptocurrency = arguments.get("cryptocurrency")
            limit = arguments.get("limit", 20)
            
            # Get articles
            if cryptocurrency:
                all_articles = await news_server.get_latest_news(limit=50)
                articles = await news_server._search_crypto_keywords(all_articles, [cryptocurrency])
                articles = articles[:limit]
            else:
                articles = await news_server.get_latest_news(limit=limit)
            
            # Simple sentiment analysis based on keywords
            positive_words = ["surge", "rise", "bullish", "growth", "adoption", "approval", "gains", "rally"]
            negative_words = ["crash", "drop", "bearish", "decline", "ban", "hack", "scam", "losses", "fall"]
            
            sentiment_analysis = {
                "positive": 0,
                "negative": 0,
                "neutral": 0,
                "total": len(articles)
            }
            
            analyzed_articles = []
            
            for article in articles:
                title_lower = article.get('title', '').lower()
                desc_lower = article.get('description', '').lower()
                combined_text = f"{title_lower} {desc_lower}"
                
                positive_count = sum(1 for word in positive_words if word in combined_text)
                negative_count = sum(1 for word in negative_words if word in combined_text)
                
                if positive_count > negative_count:
                    sentiment = "positive"
                    sentiment_analysis["positive"] += 1
                elif negative_count > positive_count:
                    sentiment = "negative"
                    sentiment_analysis["negative"] += 1
                else:
                    sentiment = "neutral"
                    sentiment_analysis["neutral"] += 1
                
                article_with_sentiment = article.copy()
                article_with_sentiment["sentiment"] = sentiment
                article_with_sentiment["positive_indicators"] = positive_count
                article_with_sentiment["negative_indicators"] = negative_count
                analyzed_articles.append(article_with_sentiment)
            
            # Calculate percentages
            if sentiment_analysis["total"] > 0:
                sentiment_analysis["positive_pct"] = round(
                    (sentiment_analysis["positive"] / sentiment_analysis["total"]) * 100, 1
                )
                sentiment_analysis["negative_pct"] = round(
                    (sentiment_analysis["negative"] / sentiment_analysis["total"]) * 100, 1
                )
                sentiment_analysis["neutral_pct"] = round(
                    (sentiment_analysis["neutral"] / sentiment_analysis["total"]) * 100, 1
                )
            
            result = {
                "cryptocurrency": cryptocurrency or "general",
                "sentiment_summary": sentiment_analysis,
                "analyzed_articles": analyzed_articles,
                "timestamp": datetime.now().isoformat()
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(result, indent=2)
            )]
        
        elif name == "get_sources":
            sources_info = {
                "available_sources": {
                    source: {
                        "name": source.title(),
                        "url": url,
                        "type": "RSS"
                    }
                    for source, url in news_server.news_sources.items()
                },
                "total_sources": len(news_server.news_sources)
            }
            
            return [types.TextContent(
                type="text",
                text=json.dumps(sources_info, indent=2)
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
        await news_server.close()

if __name__ == "__main__":
    asyncio.run(main())