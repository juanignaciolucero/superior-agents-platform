'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Settings, 
  Activity, 
  Clock, 
  DollarSign,
  Users,
  TrendingUp,
  Bot,
  FileText,
  ScrollText,
  Eye
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  description: string
  status: 'running' | 'stopped' | 'paused' | 'error'
  llm: string
  mcps: string[]
  rag: string
  createdAt: string
  lastActivity: string
  stats: {
    totalExecutions: number
    successRate: number
    avgResponseTime: number
    totalCost: number
  }
}

interface DashboardProps {
  onCreateAgent: () => void
  refreshTrigger?: number
}

export default function Dashboard({ onCreateAgent, refreshTrigger }: DashboardProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [logsAgent, setLogsAgent] = useState<Agent | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [followingLogs, setFollowingLogs] = useState(false)
  const [logsContainer, setLogsContainer] = useState<HTMLDivElement | null>(null)

  // Cargar agentes desde el backend
  useEffect(() => {
    fetchAgents()
  }, [])

  // Refresh dashboard when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchAgents()
    }
  }, [refreshTrigger])

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logsContainer) {
      logsContainer.scrollTop = logsContainer.scrollHeight
    }
  }, [logs, logsContainer])

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async (agentId: string, lines: number = 100) => {
    setLogsLoading(true)
    try {
      const response = await fetch(`http://localhost:3003/api/agents/${agentId}/logs?lines=${lines}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        setLogs(['Error fetching logs: ' + response.statusText])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      setLogs(['Error fetching logs: ' + error.message])
    } finally {
      setLogsLoading(false)
    }
  }

  const startFollowingLogs = (agentId: string) => {
    if (followingLogs) return
    
    setFollowingLogs(true)
    const eventSource = new EventSource(`http://localhost:3003/api/agents/${agentId}/logs?follow=true`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'logs' || data.type === 'stdout' || data.type === 'stderr') {
          const newLogLines = data.content.split('\n').filter(line => line.trim())
          setLogs(prevLogs => {
            const updatedLogs = [...prevLogs, ...newLogLines]
            // Keep only last 500 lines to prevent memory issues
            return updatedLogs.length > 500 ? updatedLogs.slice(-500) : updatedLogs
          })
        }
      } catch (error) {
        console.error('Error parsing log stream:', error)
      }
    }

    eventSource.onerror = () => {
      setFollowingLogs(false)
      eventSource.close()
    }

    return () => {
      setFollowingLogs(false)
      eventSource.close()
    }
  }

  const handleViewLogs = async (agent: Agent) => {
    setLogsAgent(agent)
    setLogs([])
    setFollowingLogs(false)
    await fetchLogs(agent.id)
  }

  const handleAgentAction = async (agentId: string, action: 'start' | 'stop' | 'pause' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this agent?')) return
      }

      const response = await fetch(`http://localhost:3003/api/agents/${agentId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        if (action === 'delete') {
          setAgents(agents.filter(agent => agent.id !== agentId))
        } else {
          // Actualizar el estado del agente
          setAgents(agents.map(agent => 
            agent.id === agentId 
              ? { ...agent, status: action === 'start' ? 'running' : action === 'stop' ? 'stopped' : 'paused' }
              : agent
          ))
        }
      }
    } catch (error) {
      console.error(`Error ${action} agent:`, error)
      alert(`Error ${action} agent: ${error.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'stopped': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-3 h-3" />
      case 'stopped': return <Square className="w-3 h-3" />
      case 'paused': return <Pause className="w-3 h-3" />
      case 'error': return <Activity className="w-3 h-3" />
      default: return <Square className="w-3 h-3" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and monitor your intelligent agents
              </p>
            </div>
            <button
              onClick={onCreateAgent}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Bot className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-semibold text-gray-900">{agents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Play className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {agents.filter(a => a.status === 'running').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {agents.reduce((sum, agent) => sum + (agent.stats?.totalExecutions || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${agents.reduce((sum, agent) => sum + (agent.stats?.totalCost || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agents List */}
        {agents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents yet</h3>
            <p className="text-gray-600 mb-6">Create your first intelligent agent to get started</p>
            <button
              onClick={onCreateAgent}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{agent.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {getStatusIcon(agent.status)}
                      <span className="ml-1 capitalize">{agent.status}</span>
                    </div>
                  </div>
                </div>

                {/* Agent Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Created: {new Date(agent.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Activity className="w-4 h-4 mr-2" />
                    <span>Last active: {new Date(agent.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{agent.stats?.totalExecutions || 0}</p>
                    <p className="text-xs text-gray-600">Executions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{agent.stats?.successRate || 0}%</p>
                    <p className="text-xs text-gray-600">Success Rate</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {agent.status === 'running' ? (
                      <>
                        <button
                          onClick={() => handleAgentAction(agent.id, 'pause')}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAgentAction(agent.id, 'stop')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Stop"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAgentAction(agent.id, 'start')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Start"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewLogs(agent)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Logs"
                    >
                      <ScrollText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedAgent(agent)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAgentAction(agent.id, 'delete')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedAgent.name}</h2>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedAgent.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">LLM Model</p>
                      <p className="font-medium">{selectedAgent.llm}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">RAG</p>
                      <p className="font-medium">{selectedAgent.rag}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">MCPs</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.mcps.map((mcp, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {mcp}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Executions</p>
                      <p className="text-xl font-semibold">{selectedAgent.stats?.totalExecutions || 0}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-xl font-semibold">{selectedAgent.stats?.successRate || 0}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                      <p className="text-xl font-semibold">{selectedAgent.stats?.avgResponseTime || 0}ms</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-xl font-semibold">${(selectedAgent.stats?.totalCost || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <ScrollText className="w-5 h-5 mr-2 text-purple-600" />
                    {logsAgent.name} - Logs
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Real-time agent activity and debugging information</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchLogs(logsAgent.id, 50)}
                    disabled={logsLoading}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
                  >
                    {logsLoading ? 'Loading...' : 'Refresh'}
                  </button>
                  <button
                    onClick={() => followingLogs ? setFollowingLogs(false) : startFollowingLogs(logsAgent.id)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      followingLogs 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {followingLogs ? 'Stop Live' : 'Follow Live'}
                  </button>
                  <button
                    onClick={() => {
                      if (logsContainer) {
                        logsContainer.scrollTop = logsContainer.scrollHeight
                      }
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    title="Scroll to bottom"
                  >
                    ↓ Bottom
                  </button>
                  <button
                    onClick={() => {
                      setLogsAgent(null)
                      setFollowingLogs(false)
                      setLogs([])
                      setLogsContainer(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-hidden">
              <div 
                ref={setLogsContainer}
                className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-full overflow-y-auto scroll-smooth"
                style={{ maxHeight: '60vh' }}
              >
                {logsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                    <span className="ml-3">Loading logs...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No logs available</p>
                    <p className="text-xs mt-1">Agent might not be running or no activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((line, index) => (
                      <div key={index} className="flex">
                        <span className="text-gray-500 mr-4 text-xs">{String(index + 1).padStart(3, '0')}</span>
                        <span className={`flex-1 ${
                          line.includes('ERROR') || line.includes('❌') ? 'text-red-400' :
                          line.includes('WARN') || line.includes('⚠️') ? 'text-yellow-400' :
                          line.includes('INFO') || line.includes('✅') ? 'text-blue-400' :
                          'text-green-400'
                        }`}>
                          {line}
                        </span>
                      </div>
                    ))}
                    {followingLogs && (
                      <div className="flex items-center text-green-400 animate-pulse">
                        <span className="text-gray-500 mr-4 text-xs">●</span>
                        <span className="text-sm">Live logs active...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Lines: {logs.length}</span>
                  <span className={`flex items-center ${
                    followingLogs ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      followingLogs ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    {followingLogs ? 'Live streaming' : 'Static view'}
                  </span>
                </div>
                <div className="text-xs">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}