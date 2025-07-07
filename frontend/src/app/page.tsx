'use client'

import { useState } from 'react'
import Dashboard from '@/components/Dashboard'
import AgentConfigurator from '@/components/AgentConfigurator'

export default function Home() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create'>('dashboard')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateAgent = () => {
    setCurrentView('create')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    // Trigger a refresh of the dashboard when coming back from agent creation
    setRefreshTrigger(prev => prev + 1)
  }

  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create New Agent
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Define your prompt, select sensors and configure your agent in minutes.
            </p>
          </div>
          
          <AgentConfigurator onSuccess={handleBackToDashboard} />
        </div>
      </div>
    )
  }

  return <Dashboard onCreateAgent={handleCreateAgent} refreshTrigger={refreshTrigger} />
}
