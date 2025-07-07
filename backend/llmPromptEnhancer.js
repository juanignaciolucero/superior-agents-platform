// LLM-based Prompt Enhancement Engine
// Uses OpenAI/Claude to apply prompt engineering best practices

class LLMPromptEnhancer {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    this.preferredProvider = this.openaiApiKey ? 'openai' : this.anthropicApiKey ? 'anthropic' : null;
  }

  isAvailable() {
    return this.preferredProvider !== null;
  }

  getStatus() {
    return {
      available: this.isAvailable(),
      provider: this.preferredProvider,
      model: this.preferredProvider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-haiku',
      features: ['prompt_structure', 'clarity_improvement', 'context_enhancement', 'mcp_optimization']
    };
  }

  generateEnhancementPrompt(originalPrompt, agentName, agentDescription, selectedMCPs) {
    const mcpContext = selectedMCPs && selectedMCPs.length > 0 
      ? `The agent will have access to these MCP tools: ${selectedMCPs.map(mcp => `${mcp.name} (${mcp.description})`).join(', ')}.`
      : 'The agent will have access to various MCP tools for data gathering and actions.';

    return `You are an expert prompt engineer. Your task is to enhance and improve an AI agent prompt using best practices in prompt engineering.

CONTEXT:
- Agent Name: ${agentName || 'Not specified'}
- Agent Description: ${agentDescription || 'Not specified'}
- ${mcpContext}

ORIGINAL PROMPT:
"${originalPrompt}"

ENHANCEMENT GUIDELINES:
1. **Structure**: Apply clear role definition, context setting, task specification, and output formatting
2. **Clarity**: Make instructions unambiguous and specific
3. **Context**: Add relevant context about the agent's purpose and capabilities
4. **Constraints**: Include appropriate limitations and guidelines
5. **MCP Integration**: Optimize for the available MCP tools if relevant
6. **Chain of Thought**: Encourage step-by-step reasoning when appropriate
7. **Examples**: Add few-shot examples if they would improve performance

ENHANCEMENT TECHNIQUES TO APPLY:
- Role-based prompting (You are a...)
- Clear task definition
- Step-by-step instructions
- Output format specification
- Constraint setting
- Context awareness
- Tool usage optimization

REQUIREMENTS:
- Keep the core intent and purpose of the original prompt
- Make it significantly more effective and professional
- Ensure it's optimized for the specific MCP tools available
- Length should be 2-4x longer than original but well-structured
- Use clear sections and formatting

Please provide:
1. The enhanced prompt (well-structured and professional)
2. A brief explanation of the key improvements made
3. Specific techniques applied from prompt engineering

Format your response as JSON:
{
  "enhancedPrompt": "...",
  "improvements": [
    "improvement 1",
    "improvement 2",
    "..."
  ],
  "techniques": [
    "technique 1",
    "technique 2", 
    "..."
  ],
  "confidence": 0.95
}`;
  }

  async enhancePrompt(originalPrompt, agentName = '', agentDescription = '', selectedMCPs = []) {
    if (!this.isAvailable()) {
      throw new Error('No LLM provider available for prompt enhancement');
    }

    const enhancementPrompt = this.generateEnhancementPrompt(
      originalPrompt, 
      agentName, 
      agentDescription, 
      selectedMCPs
    );

    try {
      if (this.preferredProvider === 'openai') {
        return await this.enhanceWithOpenAI(enhancementPrompt);
      } else if (this.preferredProvider === 'anthropic') {
        return await this.enhanceWithAnthropic(enhancementPrompt);
      }
    } catch (error) {
      console.error('❌ LLM prompt enhancement failed:', error);
      throw new Error(`Prompt enhancement failed: ${error.message}`);
    }
  }

  async enhanceWithOpenAI(prompt) {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert prompt engineer. Respond only with valid JSON as specified in the user prompt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  async enhanceWithAnthropic(prompt) {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Anthropic response as JSON:', content);
      throw new Error('Invalid JSON response from Anthropic');
    }
  }

  // Fallback enhancement using rule-based improvements
  enhancePromptRuleBased(originalPrompt, agentName, agentDescription, selectedMCPs) {
    console.log('🔧 Using rule-based prompt enhancement fallback');
    
    const mcpTools = selectedMCPs && selectedMCPs.length > 0 
      ? selectedMCPs.map(mcp => mcp.name).join(', ')
      : 'various data gathering and action tools';

    const enhancedPrompt = `# ${agentName || 'AI Agent'} - System Instructions

## Role Definition
You are ${agentName || 'an AI agent'} specialized in ${agentDescription || 'assisting users with various tasks'}.

## Core Objectives
${originalPrompt}

## Available Tools
You have access to the following MCP tools: ${mcpTools}.
Always use these tools to gather current, accurate data before making recommendations or decisions.

## Operating Instructions
1. **Analyze** the user's request carefully
2. **Gather Data** using appropriate MCP tools
3. **Process** the information systematically  
4. **Respond** with clear, actionable insights
5. **Cite** the data sources used in your analysis

## Response Format
- Provide clear, structured responses
- Use bullet points for lists
- Include confidence levels when making predictions
- Always explain your reasoning process

## Constraints
- Only use verified data from MCP tools
- Be transparent about limitations
- Ask for clarification when requests are ambiguous
- Maintain professional and helpful communication

Remember: Your goal is to provide maximum value through accurate analysis and clear communication.`;

    return {
      enhancedPrompt,
      improvements: [
        'Added clear role definition and structure',
        'Included specific tool usage instructions', 
        'Added step-by-step operating procedures',
        'Specified response format requirements',
        'Added appropriate constraints and guidelines'
      ],
      techniques: [
        'Role-based prompting',
        'Structured formatting',
        'Clear task definition',
        'Tool integration optimization',
        'Output format specification'
      ],
      confidence: 0.75,
      method: 'rule-based'
    };
  }
}

const llmPromptEnhancer = new LLMPromptEnhancer();

module.exports = {
  llmPromptEnhancer
};