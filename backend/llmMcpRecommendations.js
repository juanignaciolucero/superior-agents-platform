// LLM-based MCP Recommendation Engine
// Uses AI to intelligently analyze agent prompts and recommend relevant MCPs

const { getMCPById, MCP_CATALOG } = require('./mcpCatalog');

class LLMMCPRecommendationEngine {
  constructor() {
    this.availableLLMs = {
      openai: {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      },
      anthropic: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    };
    
    // Prefer OpenAI for now (easier setup)
    this.selectedLLM = process.env.OPENAI_API_KEY ? 'openai' : 
                      process.env.ANTHROPIC_API_KEY ? 'anthropic' : null;
  }

  /**
   * Generate analysis prompt for the LLM
   */
  generateAnalysisPrompt(agentName, agentDescription, agentPrompt, availableMCPs) {
    const mcpDescriptions = availableMCPs.map(mcp => 
      `- **${mcp.id}** (${mcp.name}): ${mcp.description}\n  Tools: ${mcp.tools.map(t => t.name).join(', ')}`
    ).join('\n');

    return `You are an expert AI agent consultant. Your task is to analyze an agent's purpose and recommend the most relevant MCP (Model Context Protocol) tools.

## Agent to Analyze:
**Name:** ${agentName}
**Description:** ${agentDescription}  
**Main Prompt:** ${agentPrompt}

## Available MCPs:
${mcpDescriptions}

## Your Task:
Analyze the agent's purpose and recommend the most relevant MCPs. Consider:
1. What data sources would this agent need?
2. What actions might it need to perform?
3. What tools would help it achieve its goals?

## Response Format (JSON only):
\`\`\`json
{
  "analysis": {
    "detectedPurpose": "Brief description of what the agent is designed to do",
    "primaryUseCase": "main category (e.g., trading, portfolio, monitoring, analysis)",
    "confidence": 0.95
  },
  "recommendations": [
    {
      "mcpId": "wallet-tracker",
      "confidence": 0.9,
      "reason": "Specific reason why this MCP is recommended",
      "priority": "high"
    }
  ],
  "reasoning": "Detailed explanation of the analysis and recommendations"
}
\`\`\`

Respond with ONLY the JSON, no additional text.`;
  }

  /**
   * Call LLM API for analysis
   */
  async callLLM(prompt) {
    if (!this.selectedLLM) {
      throw new Error('No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
    }

    const config = this.availableLLMs[this.selectedLLM];
    
    try {
      let requestBody;
      
      if (this.selectedLLM === 'openai') {
        requestBody = {
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI agent consultant that provides JSON responses only.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        };
      } else if (this.selectedLLM === 'anthropic') {
        requestBody = {
          model: config.model,
          max_tokens: 1000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        };
      }

      console.log(`🤖 Calling ${this.selectedLLM.toUpperCase()} for MCP analysis...`);
      
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      let content;
      if (this.selectedLLM === 'openai') {
        content = data.choices[0].message.content;
      } else if (this.selectedLLM === 'anthropic') {
        content = data.content[0].text;
      }

      console.log(`✅ LLM response received (${content.length} chars)`);
      return content;
      
    } catch (error) {
      console.error(`❌ LLM API call failed:`, error);
      throw error;
    }
  }

  /**
   * Parse LLM response and extract recommendations
   */
  parseLLMResponse(response) {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                       response.match(/```\n([\s\S]*?)\n```/) ||
                       response.match(/\{[\s\S]*\}/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      const parsed = JSON.parse(jsonStr);
      
      console.log('📊 LLM Analysis Results:');
      console.log(`  Purpose: ${parsed.analysis?.detectedPurpose}`);
      console.log(`  Use Case: ${parsed.analysis?.primaryUseCase}`);
      console.log(`  Confidence: ${Math.round((parsed.analysis?.confidence || 0) * 100)}%`);
      console.log(`  Recommendations: ${parsed.recommendations?.length || 0}`);
      
      return parsed;
      
    } catch (error) {
      console.error('❌ Failed to parse LLM response:', error);
      console.log('Raw response:', response);
      throw new Error('Failed to parse LLM analysis response');
    }
  }

  /**
   * Main analysis function using LLM
   */
  async analyzePurpose(name, description, prompt) {
    try {
      console.log('🧠 Starting LLM-based MCP analysis...');
      
      // Get available MCPs
      const availableMCPs = MCP_CATALOG.filter(mcp => mcp.id && mcp.name);
      
      // Generate analysis prompt
      const analysisPrompt = this.generateAnalysisPrompt(
        name, description, prompt, availableMCPs
      );
      
      // Call LLM
      const llmResponse = await this.callLLM(analysisPrompt);
      
      // Parse response
      const parsed = this.parseLLMResponse(llmResponse);
      
      // Convert to our expected format
      const analysis = {
        detectedUseCases: [{
          useCase: parsed.analysis?.primaryUseCase || 'general',
          score: parsed.analysis?.confidence || 0.5,
          confidence: parsed.analysis?.confidence || 0.5
        }],
        suggestedMCPs: [],
        confidence: parsed.analysis?.confidence || 0.5,
        reasoning: [
          parsed.analysis?.detectedPurpose || 'LLM analysis completed',
          parsed.reasoning || 'Recommendations based on AI analysis'
        ]
      };
      
      // Process recommendations
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        for (const rec of parsed.recommendations) {
          const mcp = getMCPById(rec.mcpId);
          if (mcp) {
            analysis.suggestedMCPs.push({
              ...mcp,
              confidence: rec.confidence || 0.5,
              reason: rec.reason || 'Recommended by AI analysis',
              priority: rec.priority || 'medium',
              suggested: true
            });
          }
        }
      }
      
      // Sort by confidence
      analysis.suggestedMCPs.sort((a, b) => b.confidence - a.confidence);
      
      console.log('✅ LLM analysis complete!');
      return analysis;
      
    } catch (error) {
      console.error('❌ LLM analysis failed:', error);
      
      // Return fallback analysis
      return {
        detectedUseCases: [],
        suggestedMCPs: [],
        confidence: 0,
        reasoning: [`LLM analysis failed: ${error.message}`, 'Fallback: All MCPs available for manual selection'],
        error: true
      };
    }
  }

  /**
   * Check if LLM is available
   */
  isAvailable() {
    // Validate API key format
    if (this.selectedLLM === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      return key && key.startsWith('sk-') && key.length > 20;
    }
    if (this.selectedLLM === 'anthropic') {
      const key = process.env.ANTHROPIC_API_KEY;
      return key && key.startsWith('sk-ant-') && key.length > 20;
    }
    return false;
  }

  /**
   * Get LLM status info
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      provider: this.selectedLLM,
      model: this.selectedLLM ? this.availableLLMs[this.selectedLLM].model : null
    };
  }
}

// Create singleton instance
const llmRecommendationEngine = new LLMMCPRecommendationEngine();

module.exports = {
  LLMMCPRecommendationEngine,
  llmRecommendationEngine
};