'use client'

import { useState, useEffect } from 'react'
import { ChevronRightIcon, CogIcon, DatabaseIcon, BrainIcon, PlayIcon, Sparkles, Compare, CheckCircle, XCircle } from 'lucide-react'

interface AgentConfig {
  name: string
  description: string
  prompt: string
  llm: string
  mcps: string[]
  rag: string
}

interface MCP {
  id: string
  name: string
  description: string
  category: string
  icon: string
  tools: Array<{
    name: string
    description: string
  }>
  pricing: string
  reliability: string
  suggested?: boolean
  confidence?: number
  reason?: string
  priority?: 'high' | 'medium' | 'low'
}

interface MCPAnalysis {
  detectedUseCases: Array<{
    useCase: string
    score: number
    confidence: number
  }>
  confidence: number
  reasoning: string[]
  method?: 'llm' | 'rules'
  llmStatus?: {
    available: boolean
    provider: string | null
    model: string | null
  }
}

interface MCPRecommendations {
  suggested: MCP[]
  all: MCP[]
}

interface PromptEnhancement {
  original: {
    prompt: string
    length: number
  }
  enhanced: {
    prompt: string
    length: number
    improvementRatio: number
  }
  analysis: {
    improvements: string[]
    techniques: string[]
    confidence: number
    method: 'llm' | 'rules'
  }
  context: {
    agentName: string
    agentDescription: string
    mcpsCount: number
    mcpsUsed: string[]
  }
}

interface MCPConfigField {
  key: string
  label: string
  type: 'text' | 'url' | 'number' | 'textarea' | 'select' | 'multiselect'
  required: boolean
  description: string
  placeholder?: string
  defaultValue?: any
  validation?: RegExp
  options?: string[] | { value: string; label: string }[]
}

interface MCPConfigRequirements {
  mcpId: string
  name: string
  description: string
  icon: string
  fields: MCPConfigField[]
  requiredEnvVars: string[]
  optionalEnvVars: string[]
  hasRequiredFields: boolean
}

interface MCPConfigsState {
  [mcpId: string]: {
    [fieldKey: string]: string | string[] | number
  }
}

const LLM_OPTIONS = [
  { id: 'claude', name: 'Claude (Anthropic)', description: 'Excellent for analysis and reasoning' },
  { id: 'gpt4', name: 'GPT-4 (OpenAI)', description: 'Versatile and reliable' },
  { id: 'gemini', name: 'Gemini (Google)', description: 'Fast and efficient' },
  { id: 'deepseek', name: 'DeepSeek', description: 'Specialized in code' },
]

// MCPs will be loaded from the backend

const RAG_OPTIONS = [
  { id: 'trading', name: 'Trading Strategies', description: 'Historical trading strategies' },
  { id: 'marketing', name: 'Marketing Campaigns', description: 'Successful marketing campaigns' },
  { id: 'general', name: 'General Knowledge', description: 'General crypto knowledge' },
  { id: 'custom', name: 'Custom RAG', description: 'Upload your own knowledge base' },
]

interface AgentConfiguratorProps {
  onSuccess?: () => void
}

export default function AgentConfigurator({ onSuccess }: AgentConfiguratorProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [mcps, setMcps] = useState<MCP[]>([])
  const [mcpAnalysis, setMcpAnalysis] = useState<MCPAnalysis | null>(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [promptEnhancement, setPromptEnhancement] = useState<PromptEnhancement | null>(null)
  const [enhancementLoading, setEnhancementLoading] = useState(false)
  const [showEnhancementModal, setShowEnhancementModal] = useState(false)
  const [enhancedPromptContainer, setEnhancedPromptContainer] = useState<HTMLDivElement | null>(null)
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfigsState>({})
  const [mcpConfigRequirements, setMcpConfigRequirements] = useState<MCPConfigRequirements[]>([])
  const [showMcpConfigModal, setShowMcpConfigModal] = useState(false)
  const [configErrors, setConfigErrors] = useState<{[mcpId: string]: string[]}>({})
  const [configWarnings, setConfigWarnings] = useState<{[mcpId: string]: string[]}>({})
  const [configLoading, setConfigLoading] = useState(false)
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    prompt: '',
    llm: '',
    mcps: [],
    rag: '',
  })

  const steps = [
    { id: 1, title: 'Basic Information', icon: CogIcon },
    { id: 2, title: 'Select LLM', icon: BrainIcon },
    { id: 3, title: 'Select MCPs', icon: DatabaseIcon },
    { id: 4, title: 'Configure RAG', icon: DatabaseIcon },
    { id: 5, title: 'Deploy', icon: PlayIcon },
  ]

  // Load MCPs from backend
  useEffect(() => {
    fetch('http://localhost:3003/api/mcps')
      .then(res => res.json())
      .then(data => setMcps(data.mcps))
      .catch(console.error);
  }, [])

  // Analyze prompt and get MCP recommendations
  const analyzeMCPRecommendations = async () => {
    if (!config.name && !config.description && !config.prompt) {
      return;
    }

    setRecommendationsLoading(true);
    try {
      const response = await fetch('http://localhost:3003/api/mcps/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          prompt: config.prompt
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMcpAnalysis(data.analysis);
        
        // Update MCPs with recommendations
        setMcps(data.recommendations.all);
        
        console.log('🧠 MCP Analysis:', data);
      }
    } catch (error) {
      console.error('Error analyzing MCPs:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Auto-analyze when moving to MCP step
  useEffect(() => {
    if (currentStep === 3 && (config.name || config.description || config.prompt)) {
      analyzeMCPRecommendations();
    }
  }, [currentStep])

  // Fetch MCP configuration requirements when MCPs change
  useEffect(() => {
    if (config.mcps.length > 0) {
      fetchMcpConfigRequirements(config.mcps);
    } else {
      setMcpConfigRequirements([]);
      setMcpConfigs({});
    }
  }, [config.mcps])

  // Enhance prompt using LLM
  const enhancePrompt = async () => {
    if (!config.prompt || config.prompt.trim().length < 10) {
      alert('Please enter a prompt of at least 10 characters before enhancing.');
      return;
    }

    setEnhancementLoading(true);
    try {
      const selectedMCPIds = config.mcps.map(mcpId => ({ id: mcpId }));
      
      const response = await fetch('http://localhost:3003/api/prompts/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: config.prompt,
          agentName: config.name,
          agentDescription: config.description,
          selectedMCPs: selectedMCPIds
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPromptEnhancement(data);
        setShowEnhancementModal(true);
        
        console.log('✨ Prompt Enhancement:', data);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enhance prompt');
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      alert(`Error enhancing prompt: ${error.message}`);
    } finally {
      setEnhancementLoading(false);
    }
  }

  const acceptEnhancement = () => {
    if (promptEnhancement) {
      setConfig(prev => ({ ...prev, prompt: promptEnhancement.enhanced.prompt }));
      setShowEnhancementModal(false);
      setPromptEnhancement(null);
    }
  }

  const rejectEnhancement = () => {
    setShowEnhancementModal(false);
    setPromptEnhancement(null);
  }

  // Fetch MCP configuration requirements
  const fetchMcpConfigRequirements = async (mcpIds: string[]) => {
    if (mcpIds.length === 0) {
      setMcpConfigRequirements([]);
      return;
    }

    setConfigLoading(true);
    try {
      const response = await fetch('http://localhost:3003/api/mcps/config-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mcpIds })
      });

      if (response.ok) {
        const data = await response.json();
        setMcpConfigRequirements(data.requirements.mcps);
        
        // Initialize config state for MCPs that need configuration
        const newMcpConfigs = { ...mcpConfigs };
        data.requirements.mcps.forEach((req: MCPConfigRequirements) => {
          if (req.hasRequiredFields && !newMcpConfigs[req.mcpId]) {
            newMcpConfigs[req.mcpId] = {};
            // Set default values
            req.fields.forEach(field => {
              if (field.defaultValue !== undefined) {
                newMcpConfigs[req.mcpId][field.key] = field.defaultValue;
              }
            });
          }
        });
        setMcpConfigs(newMcpConfigs);
      }
    } catch (error) {
      console.error('Error fetching MCP config requirements:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  // Update MCP configuration value
  const updateMcpConfig = (mcpId: string, fieldKey: string, value: any) => {
    setMcpConfigs(prev => ({
      ...prev,
      [mcpId]: {
        ...prev[mcpId],
        [fieldKey]: value
      }
    }));

    // Clear errors and warnings for this field
    if (configErrors[mcpId]) {
      setConfigErrors(prev => ({
        ...prev,
        [mcpId]: prev[mcpId].filter(error => !error.includes(fieldKey))
      }));
    }
    if (configWarnings[mcpId]) {
      setConfigWarnings(prev => ({
        ...prev,
        [mcpId]: prev[mcpId].filter(warning => !warning.includes(fieldKey))
      }));
    }

    // Validate after a short delay (debounced validation)
    setTimeout(() => {
      validateMcpConfig(mcpId);
    }, 500);
  };

  // Validate MCP configuration
  const validateMcpConfig = async (mcpId: string) => {
    const configValues = mcpConfigs[mcpId] || {};
    
    try {
      const response = await fetch(`http://localhost:3003/api/mcps/${mcpId}/validate-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configValues })
      });

      if (response.ok) {
        const data = await response.json();
        setConfigErrors(prev => ({
          ...prev,
          [mcpId]: data.validation.errors || []
        }));
        setConfigWarnings(prev => ({
          ...prev,
          [mcpId]: data.validation.warnings || []
        }));
        return data.validation.valid;
      }
    } catch (error) {
      console.error('Error validating MCP config:', error);
    }
    return false;
  };

  // Check if MCPs need configuration
  const checkMcpConfigurationNeeded = () => {
    const mcpsNeedingConfig = mcpConfigRequirements.filter(req => req.hasRequiredFields);
    if (mcpsNeedingConfig.length > 0) {
      setShowMcpConfigModal(true);
    }
  };

  // Save MCP configurations
  const saveMcpConfigurations = async () => {
    if (!config.name) {
      alert('Please provide an agent name first');
      return false;
    }

    // Generate a temporary agent ID if we don't have one
    const agentId = config.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

    try {
      const response = await fetch(`http://localhost:3003/api/agents/${agentId}/mcp-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mcpConfigs })
      });

      if (response.ok) {
        console.log('✅ MCP configurations saved successfully');
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save MCP configuration');
      }
    } catch (error) {
      console.error('Error saving MCP configurations:', error);
      alert(`Error saving MCP configurations: ${error.message}`);
      return false;
    }
  };

  const handleNext = () => {
    // Check if we need MCP configurations before moving to next step
    if (currentStep === 3) {
      const mcpsNeedingConfig = mcpConfigRequirements.filter(req => req.hasRequiredFields);
      if (mcpsNeedingConfig.length > 0) {
        // Check if all required configurations are filled
        const missingConfigs = mcpsNeedingConfig.filter(req => {
          const configValues = mcpConfigs[req.mcpId] || {};
          return req.fields.some(field => 
            field.required && (!configValues[field.key] || configValues[field.key] === '')
          );
        });

        if (missingConfigs.length > 0) {
          setShowMcpConfigModal(true);
          return;
        }
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleMCPToggle = (mcpId: string) => {
    console.log('🔄 Toggling MCP:', mcpId);
    setConfig(prev => {
      const newMcps = prev.mcps.includes(mcpId)
        ? prev.mcps.filter(id => id !== mcpId)
        : [...prev.mcps, mcpId];
      console.log('📋 Updated MCPs:', newMcps);
      return {
        ...prev,
        mcps: newMcps
      };
    });
  }

  const handleDeploy = async () => {
    try {
      // Check if MCPs need configuration before deployment
      const mcpsNeedingConfig = mcpConfigRequirements.filter(req => req.hasRequiredFields);
      if (mcpsNeedingConfig.length > 0) {
        const missingConfigs = mcpsNeedingConfig.filter(req => {
          const configValues = mcpConfigs[req.mcpId] || {};
          return req.fields.some(field => 
            field.required && (!configValues[field.key] || configValues[field.key] === '')
          );
        });

        if (missingConfigs.length > 0) {
          alert(`Please configure the following MCPs before deployment: ${missingConfigs.map(req => req.name).join(', ')}`);
          setShowMcpConfigModal(true);
          return;
        }

        // Validate all configurations before deployment
        let allValid = true;
        for (const req of mcpsNeedingConfig) {
          const isValid = await validateMcpConfig(req.mcpId);
          if (!isValid) allValid = false;
        }

        if (!allValid) {
          alert('Please fix MCP configuration errors before deployment.');
          setShowMcpConfigModal(true);
          return;
        }
      }

      // Enviar configuración al backend
      const response = await fetch('http://localhost:3003/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Agent created successfully:', result);

      // Save MCP configurations if any
      if (Object.keys(mcpConfigs).length > 0) {
        const configSaved = await saveMcpConfigurations();
        if (!configSaved) {
          console.error('Failed to save MCP configurations, but continuing with deployment...');
        }
      }

      // Desplegar el agente
      const deployResponse = await fetch(`http://localhost:3003/api/agents/${result.agentId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!deployResponse.ok) {
        throw new Error(`Deploy error! status: ${deployResponse.status}`);
      }

      const deployResult = await deployResponse.json();
      console.log('Agent deployment started:', deployResult);

      console.log(`✅ Agent "${config.name}" created and deployed successfully! ID: ${result.agentId}`);
      
      // Callback para regresar al dashboard directamente
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error deploying agent:', error);
      alert(`Error deploying agent: ${error.message}`);
    }
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: return config.name && config.description && config.prompt
      case 2: return config.llm
      case 3: return config.mcps.length > 0
      case 4: return config.rag
      default: return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Agent Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Trading Agent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what your agent does..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Main Prompt
                </label>
                <button
                  onClick={enhancePrompt}
                  disabled={enhancementLoading || !config.prompt || config.prompt.trim().length < 10}
                  className={`inline-flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                    enhancementLoading || !config.prompt || config.prompt.trim().length < 10
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                  title="Enhance your prompt using AI and prompt engineering best practices"
                >
                  {enhancementLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-2"></div>
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      ✨ Enhance Prompt
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={config.prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="You are an intelligent agent specialized in... Describe here the behavior you want your agent to have."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Use the "Enhance Prompt" button to apply AI-powered prompt engineering techniques
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Select LLM Model</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LLM_OPTIONS.map((llm) => (
                <div
                  key={llm.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    config.llm === llm.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setConfig(prev => ({ ...prev, llm: llm.id }))}
                >
                  <h3 className="font-semibold text-gray-900">{llm.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{llm.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Select MCP Clients</h2>
                <p className="text-gray-600">Choose the MCP (Model Context Protocol) clients your agent will use to gather data and execute actions.</p>
              </div>
              {!recommendationsLoading && mcpAnalysis && (
                <button
                  onClick={analyzeMCPRecommendations}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  🧠 Re-analyze
                </button>
              )}
            </div>

            {/* Loading state */}
            {recommendationsLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700">Analyzing your agent's purpose to recommend relevant MCPs...</span>
                </div>
              </div>
            )}

            {/* Analysis results */}
            {mcpAnalysis && !recommendationsLoading && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-green-900">🎯 Analysis Complete!</h3>
                      {mcpAnalysis.method === 'llm' ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                          🤖 AI-Powered
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          🔧 Rule-Based
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {mcpAnalysis.reasoning.map((reason, index) => (
                        <p key={index} className="text-sm text-green-800">{reason}</p>
                      ))}
                    </div>
                    {mcpAnalysis.confidence > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center text-sm text-green-700">
                          <span>Confidence: {Math.round(mcpAnalysis.confidence * 100)}%</span>
                          <div className="ml-2 flex-1 bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${mcpAnalysis.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Auto-select button */}
                  {mcps.filter(mcp => mcp.suggested).length > 0 && (
                    <button
                      onClick={() => {
                        const suggestedIds = mcps.filter(mcp => mcp.suggested).map(mcp => mcp.id);
                        setConfig(prev => ({ ...prev, mcps: suggestedIds }));
                      }}
                      className="ml-4 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex-shrink-0"
                    >
                      ✓ Select All Recommended
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Suggested MCPs first */}
              {mcps
                .filter(mcp => mcp.suggested)
                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                .map((mcp) => (
                  <div
                    key={mcp.id}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      config.mcps.includes(mcp.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-green-300 bg-green-25 hover:border-green-400'
                    }`}
                    onClick={() => handleMCPToggle(mcp.id)}
                  >
                    {/* Recommended badge */}
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ⭐ Recommended
                    </div>
                    
                    <div className="flex items-start">
                      <span className="text-2xl mr-3 mt-1">{mcp.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            {mcp.name}
                            {mcpConfigRequirements.find(req => req.mcpId === mcp.id && req.hasRequiredFields) && (
                              <span className="ml-2 px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                                🔧 Config Required
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {Math.round((mcp.confidence || 0) * 100)}% match
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              mcp.pricing === 'free' ? 'bg-green-100 text-green-800' :
                              mcp.pricing === 'freemium' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {mcp.pricing}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{mcp.description}</p>
                        {mcp.reason && (
                          <p className="text-xs text-green-700 bg-green-100 p-2 rounded mb-2">
                            💡 {mcp.reason}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {mcp.tools.length} tools • {mcp.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              
              {/* Other MCPs */}
              {mcps
                .filter(mcp => !mcp.suggested)
                .map((mcp) => (
                  <div
                    key={mcp.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      config.mcps.includes(mcp.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMCPToggle(mcp.id)}
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-3 mt-1">{mcp.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            {mcp.name}
                            {mcpConfigRequirements.find(req => req.mcpId === mcp.id && req.hasRequiredFields) && (
                              <span className="ml-2 px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                                🔧 Config Required
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              mcp.pricing === 'free' ? 'bg-green-100 text-green-800' :
                              mcp.pricing === 'freemium' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {mcp.pricing}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              mcp.reliability === 'high' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {mcp.reliability}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{mcp.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {mcp.tools.length} tools • {mcp.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              
              {/* Show message if no suggestions and no loading */}
              {!recommendationsLoading && mcps.filter(mcp => mcp.suggested).length === 0 && mcpAnalysis && (
                <div className="col-span-2 text-center py-8">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-2">No specific recommendations</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      We couldn't detect a specific use case from your agent description. 
                      All MCPs below are available for selection.
                    </p>
                    <button 
                      onClick={analyzeMCPRecommendations}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Try re-analyzing with more details →
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {config.mcps.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900">Selected MCPs</h4>
                  {mcpConfigRequirements.filter(req => req.hasRequiredFields).length > 0 && (
                    <button
                      onClick={() => setShowMcpConfigModal(true)}
                      className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-md hover:bg-orange-200 flex items-center"
                    >
                      🔧 Configure MCPs
                      {mcpConfigRequirements.filter(req => {
                        const configValues = mcpConfigs[req.mcpId] || {};
                        return req.fields.some(field => 
                          field.required && (!configValues[field.key] || configValues[field.key] === '')
                        );
                      }).length > 0 && (
                        <span className="ml-1 px-1 py-0.5 bg-red-500 text-white rounded-full text-xs">
                          {mcpConfigRequirements.filter(req => {
                            const configValues = mcpConfigs[req.mcpId] || {};
                            return req.fields.some(field => 
                              field.required && (!configValues[field.key] || configValues[field.key] === '')
                            );
                          }).length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.mcps.map(mcpId => {
                    const mcp = mcps.find(m => m.id === mcpId);
                    const needsConfig = mcpConfigRequirements.find(req => req.mcpId === mcpId && req.hasRequiredFields);
                    const hasIncompleteConfig = needsConfig && (() => {
                      const configValues = mcpConfigs[mcpId] || {};
                      return needsConfig.fields.some(field => 
                        field.required && (!configValues[field.key] || configValues[field.key] === '')
                      );
                    })();
                    
                    return mcp ? (
                      <span key={mcpId} className={`px-3 py-1 rounded-full text-sm flex items-center ${
                        hasIncompleteConfig 
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {mcp.icon} {mcp.name}
                        {hasIncompleteConfig && (
                          <span className="ml-1 text-xs">⚠️</span>
                        )}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Configure RAG</h2>
            <p className="text-gray-600">Select the knowledge base that your agent will use.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RAG_OPTIONS.map((rag) => (
                <div
                  key={rag.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    config.rag === rag.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setConfig(prev => ({ ...prev, rag: rag.id }))}
                >
                  <h3 className="font-semibold text-gray-900">{rag.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{rag.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Summary and Deployment</h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Final Configuration</h3>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-600">{config.name}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">LLM:</span>
                  <span className="ml-2 text-gray-600">
                    {LLM_OPTIONS.find(llm => llm.id === config.llm)?.name}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">MCPs:</span>
                  <span className="ml-2 text-gray-600">
                    {config.mcps.map(mcpId => 
                      mcps.find(mcp => mcp.id === mcpId)?.name
                    ).join(', ')}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">RAG:</span>
                  <span className="ml-2 text-gray-600">
                    {RAG_OPTIONS.find(rag => rag.id === config.rag)?.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Ready to deploy?</h4>
              <p className="text-blue-700 text-sm">
                Your agent will be created and deployed to the cloud. You will receive a dashboard to monitor its activity.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="bg-gray-50 px-6 py-4 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`px-4 py-2 rounded-md ${
            currentStep === 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          Previous
        </button>
        
        {currentStep < steps.length ? (
          <button
            onClick={handleNext}
            disabled={!isStepComplete(currentStep)}
            className={`px-4 py-2 rounded-md ${
              isStepComplete(currentStep)
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleDeploy}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
          >
            🚀 Deploy Agent
          </button>
        )}
      </div>

      {/* Prompt Enhancement Modal */}
      {showEnhancementModal && promptEnhancement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-7xl w-full mx-4 max-h-[95vh] flex flex-col" style={{ height: '90vh' }}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                    Prompt Enhancement Results
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    AI-enhanced prompt using {promptEnhancement.analysis.method === 'llm' ? 'LLM analysis' : 'rule-based techniques'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    promptEnhancement.analysis.method === 'llm' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {promptEnhancement.analysis.method === 'llm' ? '🤖 LLM-Enhanced' : '🔧 Rule-Based'}
                  </span>
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                    {Math.round(promptEnhancement.analysis.confidence * 100)}% Confidence
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: '60vh' }}>
                {/* Original Prompt */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      📝 Original Prompt
                    </h3>
                    <span className="text-xs text-gray-500">
                      {promptEnhancement.original.length} characters
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300" style={{ maxHeight: '45vh' }}>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {promptEnhancement.original.prompt}
                    </pre>
                  </div>
                </div>

                {/* Enhanced Prompt */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      ✨ Enhanced Prompt
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{promptEnhancement.enhanced.length} characters</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        {promptEnhancement.enhanced.improvementRatio}x longer
                      </span>
                      <button
                        onClick={() => {
                          if (enhancedPromptContainer) {
                            enhancedPromptContainer.scrollTop = enhancedPromptContainer.scrollHeight
                          }
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        title="Scroll to bottom"
                      >
                        ↓ End
                      </button>
                    </div>
                  </div>
                  <div 
                    ref={setEnhancedPromptContainer}
                    className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-track-green-100 scrollbar-thumb-green-300" 
                    style={{ maxHeight: '45vh' }}
                  >
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {promptEnhancement.enhanced.prompt}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto" style={{ maxHeight: '25vh' }}>
                {/* Improvements */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    🎯 Key Improvements
                  </h4>
                  <ul className="space-y-2">
                    {promptEnhancement.analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Techniques */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    🛠️ Techniques Applied
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {promptEnhancement.analysis.techniques.map((technique, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {technique}
                      </span>
                    ))}
                  </div>
                  
                  {promptEnhancement.context.mcpsUsed.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">🔧 Optimized for MCPs:</h5>
                      <div className="flex flex-wrap gap-1">
                        {promptEnhancement.context.mcpsUsed.map((mcp, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {mcp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Enhancement Summary:</p>
                  <p>
                    Improved from {promptEnhancement.original.length} to {promptEnhancement.enhanced.length} characters 
                    using {promptEnhancement.analysis.techniques.length} prompt engineering techniques
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={rejectEnhancement}
                    className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Keep Original
                  </button>
                  <button
                    onClick={acceptEnhancement}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Use Enhanced Prompt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MCP Configuration Modal */}
      {showMcpConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    🔧 Configure MCPs
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Provide required configuration for selected MCPs
                  </p>
                </div>
                <button
                  onClick={() => setShowMcpConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {mcpConfigRequirements.filter(req => req.hasRequiredFields).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Configuration Required</h3>
                  <p className="text-gray-600">All selected MCPs are ready to use without additional configuration.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {mcpConfigRequirements
                    .filter(req => req.hasRequiredFields)
                    .map((req) => (
                      <div key={req.mcpId} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{req.icon}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{req.name}</h3>
                              <p className="text-sm text-gray-600">{req.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {(() => {
                              const configValues = mcpConfigs[req.mcpId] || {};
                              const hasRequiredFields = req.fields.every(field => 
                                !field.required || (configValues[field.key] && configValues[field.key] !== '')
                              );
                              const hasErrors = configErrors[req.mcpId] && configErrors[req.mcpId].length > 0;
                              
                              if (hasErrors) {
                                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">❌ Invalid</span>;
                              } else if (hasRequiredFields) {
                                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✅ Valid</span>;
                              } else {
                                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">⚠️ Incomplete</span>;
                              }
                            })()}
                          </div>
                        </div>

                        {configErrors[req.mcpId] && configErrors[req.mcpId].length > 0 && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm font-medium text-red-800 mb-1">Configuration Errors:</p>
                            <ul className="text-sm text-red-700 list-disc list-inside">
                              {configErrors[req.mcpId].map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {configWarnings[req.mcpId] && configWarnings[req.mcpId].length > 0 && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm font-medium text-yellow-800 mb-1">Configuration Warnings:</p>
                            <ul className="text-sm text-yellow-700 list-disc list-inside">
                              {configWarnings[req.mcpId].map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {req.fields.map((field) => (
                            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              
                              {field.type === 'textarea' ? (
                                <textarea
                                  value={mcpConfigs[req.mcpId]?.[field.key] || ''}
                                  onChange={(e) => updateMcpConfig(req.mcpId, field.key, e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={field.placeholder}
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  value={mcpConfigs[req.mcpId]?.[field.key] || field.defaultValue || ''}
                                  onChange={(e) => updateMcpConfig(req.mcpId, field.key, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select {field.label}</option>
                                  {field.options?.map((option) => {
                                    const value = typeof option === 'string' ? option : option.value;
                                    const label = typeof option === 'string' ? option : option.label;
                                    return (
                                      <option key={value} value={value}>{label}</option>
                                    );
                                  })}
                                </select>
                              ) : field.type === 'multiselect' ? (
                                <div className="space-y-2">
                                  {field.options?.map((option) => {
                                    const value = typeof option === 'string' ? option : option.value;
                                    const label = typeof option === 'string' ? option : option.label;
                                    const currentValues = mcpConfigs[req.mcpId]?.[field.key] as string[] || field.defaultValue || [];
                                    const isSelected = currentValues.includes(value);
                                    
                                    return (
                                      <label key={value} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const newValues = e.target.checked
                                              ? [...currentValues, value]
                                              : currentValues.filter(v => v !== value);
                                            updateMcpConfig(req.mcpId, field.key, newValues);
                                          }}
                                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{label}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              ) : (
                                <input
                                  type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                                  value={mcpConfigs[req.mcpId]?.[field.key] || ''}
                                  onChange={(e) => updateMcpConfig(req.mcpId, field.key, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={field.placeholder}
                                />
                              )}
                              
                              {field.description && (
                                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Configuration Status:</p>
                  <p>
                    {(() => {
                      const mcpsNeedingConfig = mcpConfigRequirements.filter(req => req.hasRequiredFields);
                      const configuredMcps = mcpsNeedingConfig.filter(req => {
                        const configValues = mcpConfigs[req.mcpId] || {};
                        return req.fields.every(field => 
                          !field.required || (configValues[field.key] && configValues[field.key] !== '')
                        );
                      });
                      return `${configuredMcps.length} of ${mcpsNeedingConfig.length} MCPs configured`;
                    })()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowMcpConfigModal(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      console.log('🔧 Validating MCP configurations...');
                      
                      // Validate all configurations
                      let allValid = true;
                      let errorCount = 0;
                      const mcpsNeedingConfig = mcpConfigRequirements.filter(req => req.hasRequiredFields);
                      
                      for (const req of mcpsNeedingConfig) {
                        console.log(`Validating ${req.name} (${req.mcpId})...`);
                        console.log(`Current config for ${req.mcpId}:`, mcpConfigs[req.mcpId]);
                        
                        const isValid = await validateMcpConfig(req.mcpId);
                        
                        // Wait a bit for state to update after validation
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        const errors = configErrors[req.mcpId] || [];
                        console.log(`Current errors for ${req.mcpId}:`, errors);
                        
                        if (!isValid || errors.length > 0) {
                          allValid = false;
                          errorCount += errors.length;
                          console.log(`❌ ${req.name} validation failed:`, errors);
                        } else {
                          console.log(`✅ ${req.name} validation passed`);
                        }
                      }
                      
                      if (allValid) {
                        setShowMcpConfigModal(false);
                        alert('MCP configurations saved successfully!');
                      } else {
                        console.log(`❌ Total validation errors: ${errorCount}`);
                        
                        // If errorCount is 0 but allValid is false, check for missing required fields
                        if (errorCount === 0) {
                          const missingFields = [];
                          for (const req of mcpsNeedingConfig) {
                            const configValues = mcpConfigs[req.mcpId] || {};
                            const missingRequiredFields = req.fields.filter(field => 
                              field.required && (!configValues[field.key] || configValues[field.key] === '')
                            );
                            if (missingRequiredFields.length > 0) {
                              missingFields.push(`${req.name}: ${missingRequiredFields.map(f => f.label).join(', ')}`);
                            }
                          }
                          
                          if (missingFields.length > 0) {
                            console.log('❌ Missing required fields:', missingFields);
                            alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
                          } else {
                            alert('Configuration validation failed. Please check the console for details.');
                          }
                        } else {
                          alert(`Please fix the ${errorCount} configuration error(s) shown above before continuing.`);
                        }
                        
                        // Scroll to first error or incomplete section
                        const firstErrorElement = document.querySelector('.bg-red-50, .bg-yellow-50');
                        if (firstErrorElement) {
                          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}