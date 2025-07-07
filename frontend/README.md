# Superior Agents Platform - Frontend

![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black.svg)
![React](https://img.shields.io/badge/react-19.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-4.0-blue.svg)

The frontend application for the Superior Agents Platform. Built with Next.js, React, and TypeScript, this modern web application provides an intuitive interface for creating, configuring, and managing intelligent AI agents.

## 🌟 Features

### 🎯 **Agent Configurator**
- **Step-by-step Wizard**: Guided agent creation process
- **Real-time Validation**: Instant feedback on configuration errors
- **Smart Recommendations**: AI-powered MCP suggestions based on agent purpose
- **Configuration Preview**: Visual representation of agent settings

### 📊 **Agent Dashboard**
- **Real-time Monitoring**: Live status updates for all deployed agents
- **Performance Metrics**: Execution statistics and success rates
- **Interactive Controls**: Start, stop, pause, and delete agents
- **Live Logs**: Real-time log streaming from deployed agents

### 🔌 **MCP Configuration**
- **Dynamic Forms**: Auto-generated configuration forms based on MCP requirements
- **Field Validation**: Real-time validation with helpful error messages
- **Dependency Management**: Smart handling of field dependencies
- **Progress Tracking**: Visual indicators for configuration completion

### 🤖 **Multi-LLM Support**
- **Provider Selection**: Choose from Claude, GPT-4, Gemini, and DeepSeek
- **Model Comparison**: Side-by-side comparison of LLM capabilities
- **Performance Insights**: Historical performance data for each model

## 🏗️ Architecture

```
Frontend Architecture
├── 🌐 Next.js App Router
│   ├── Pages & Layouts
│   ├── API Routes (future)
│   └── Static Assets
├── ⚛️ React Components
│   ├── Agent Configurator
│   ├── Dashboard
│   ├── MCP Configuration
│   └── Shared UI Components
├── 🎨 Styling
│   ├── Tailwind CSS
│   ├── Lucide Icons
│   └── Responsive Design
└── 🔧 State Management
    ├── React Hooks
    ├── Local State
    └── API Integration
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.18.0
- **npm** or **yarn**

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Type checking
npx tsc --noEmit
```

## 📁 Project Structure

```
frontend/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── favicon.ico           # Application favicon
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout component
│   │   └── page.tsx              # Home page component
│   └── 📁 components/            # React components
│       ├── AgentConfigurator.tsx # Agent creation wizard
│       └── Dashboard.tsx         # Agent management dashboard
├── 📁 public/                    # Static assets
│   ├── next.svg                  # Next.js logo
│   └── vercel.svg               # Vercel logo
├── 📄 package.json              # Dependencies and scripts
├── 📄 tsconfig.json             # TypeScript configuration
├── 📄 tailwind.config.js        # Tailwind CSS configuration
├── 📄 postcss.config.mjs        # PostCSS configuration
├── 📄 next.config.ts            # Next.js configuration
└── 📄 eslint.config.mjs         # ESLint configuration
```

## 🎨 UI Components

### Agent Configurator (`AgentConfigurator.tsx`)

The main component for creating and configuring agents:

```typescript
interface AgentConfig {
  name: string
  description: string
  prompt: string
  llm: string
  mcps: string[]
  rag: string
}

// Key features:
- Multi-step configuration wizard
- Real-time MCP recommendations
- Dynamic configuration forms
- Prompt enhancement with AI
- Deployment readiness validation
```

### Dashboard (`Dashboard.tsx`)

Comprehensive agent management interface:

```typescript
interface Agent {
  id: string
  name: string
  description: string
  status: 'running' | 'stopped' | 'paused' | 'error'
  llm: string
  mcps: string[]
  stats: {
    totalExecutions: number
    successRate: number
    avgResponseTime: number
    totalCost: number
  }
}

// Key features:
- Agent list with status indicators
- Real-time performance metrics
- Interactive agent controls
- Live log streaming
- Agent details modal
```

### MCP Configuration

Dynamic configuration forms based on MCP requirements:

```typescript
interface MCPConfigField {
  key: string
  label: string
  type: 'text' | 'url' | 'number' | 'textarea' | 'select'
  required: boolean
  description: string
  validation?: RegExp
}

// Features:
- Auto-generated forms
- Real-time validation
- Field dependencies
- Progress indicators
```

## 🎨 Styling & Design

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
      }
    },
  },
  plugins: [],
}
```

### Design System

#### Colors
- **Primary**: Blue (#3B82F6) - Main actions, links
- **Secondary**: Green (#10B981) - Success states, running agents
- **Accent**: Yellow (#F59E0B) - Warnings, paused states
- **Error**: Red (#EF4444) - Error states, failed deployments

#### Typography
- **Headings**: Inter font family with semibold weight
- **Body**: Inter font family with regular weight
- **Code**: Fira Code for code snippets and logs

#### Icons
Using Lucide React for consistent iconography:
```typescript
import { 
  Plus, Play, Pause, Square, Trash2, 
  Settings, Activity, Bot, Sparkles 
} from 'lucide-react'
```

### Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

```css
/* Example responsive utilities */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Responsive grid layout -->
</div>
```

## 🔧 State Management

### React Hooks Pattern

The application uses React hooks for state management:

```typescript
// Agent state management
const [agents, setAgents] = useState<Agent[]>([])
const [loading, setLoading] = useState(true)
const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

// MCP configuration state
const [mcpConfigs, setMcpConfigs] = useState<Record<string, any>>({})
const [configErrors, setConfigErrors] = useState<Record<string, string[]>>({})
const [configurationComplete, setConfigurationComplete] = useState(false)

// UI state
const [currentView, setCurrentView] = useState<'dashboard' | 'create'>('dashboard')
const [refreshTrigger, setRefreshTrigger] = useState(0)
```

### API Integration

Centralized API calls with error handling:

```typescript
// Agent operations
const fetchAgents = async () => {
  try {
    const response = await fetch('http://localhost:3003/api/agents')
    const data = await response.json()
    setAgents(data.agents || [])
  } catch (error) {
    console.error('Error loading agents:', error)
  }
}

// MCP configuration
const validateMCPConfig = async (mcpId: string, configValues: any) => {
  try {
    const response = await fetch(`http://localhost:3003/api/mcps/${mcpId}/validate-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configValues })
    })
    return await response.json()
  } catch (error) {
    console.error('Validation error:', error)
    return { valid: false, errors: ['Network error'] }
  }
}
```

## 🧪 Testing

### Component Testing with Jest

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Example test structure:
```typescript
// __tests__/components/Dashboard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import Dashboard from '@/components/Dashboard'

describe('Dashboard', () => {
  test('renders agent list', () => {
    render(<Dashboard onCreateAgent={() => {}} />)
    expect(screen.getByText('Agent Dashboard')).toBeInTheDocument()
  })

  test('handles agent actions', async () => {
    // Test agent start/stop/pause/delete functionality
  })
})
```

### End-to-End Testing with Playwright

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e
```

Example E2E test:
```typescript
// e2e/agent-creation.spec.ts
import { test, expect } from '@playwright/test'

test('create new agent', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('text=Create Agent')
  await page.fill('[placeholder="Agent Name"]', 'Test Agent')
  await page.click('text=Deploy Agent')
  await expect(page).toHaveText('Agent created successfully')
})
```

## 🔍 Performance Optimization

### Code Splitting

Next.js automatically splits code by pages. Additional optimizations:

```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
})

// Lazy loading for modals
const AgentDetailsModal = lazy(() => import('./AgentDetailsModal'))
```

### Image Optimization

```typescript
import Image from 'next/image'

// Optimized image loading
<Image
  src="/agent-icon.png"
  alt="Agent Icon"
  width={64}
  height={64}
  priority={false}
  placeholder="blur"
/>
```

### Caching Strategy

```typescript
// API response caching
const fetchWithCache = async (url: string) => {
  const cached = localStorage.getItem(url)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes
      return data
    }
  }
  
  const response = await fetch(url)
  const data = await response.json()
  
  localStorage.setItem(url, JSON.stringify({
    data,
    timestamp: Date.now()
  }))
  
  return data
}
```

## 🛡️ Security

### Input Sanitization

```typescript
// XSS protection
const sanitizeInput = (input: string) => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Use in components
<input
  value={sanitizeInput(userInput)}
  onChange={(e) => setUserInput(e.target.value)}
/>
```

### Environment Variables

```typescript
// next.config.ts
module.exports = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Only expose necessary variables to client
}
```

### Content Security Policy

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Production deployment
vercel --prod
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Build Optimization

```bash
# Analyze bundle size
npm run build
npm run analyze

# Bundle analyzer
npm install --save-dev @next/bundle-analyzer
```

## 📊 Analytics & Monitoring

### Performance Monitoring

```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

### Error Tracking

```typescript
// Error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }

    return this.props.children
  }
}
```

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow the existing code style and ESLint rules
2. **TypeScript**: Use strict typing, avoid `any` types
3. **Components**: Keep components small and focused
4. **Testing**: Write tests for new components and features
5. **Accessibility**: Ensure WCAG 2.1 compliance

### Component Development

```typescript
// Component template
import React, { useState, useEffect } from 'react'
import { ComponentProps } from './types'

interface Props extends ComponentProps {
  // Define component props
}

export default function ComponentName({ prop1, prop2, ...props }: Props) {
  const [state, setState] = useState<StateType>(initialState)

  useEffect(() => {
    // Effect logic
  }, [dependencies])

  const handleAction = () => {
    // Event handler logic
  }

  return (
    <div className="component-container" {...props}>
      {/* Component JSX */}
    </div>
  )
}
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-frontend-improvement`
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Ensure ESLint passes: `npm run lint`
6. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

<div align="center">
<b>Superior Agents Platform Frontend</b><br>
<i>Intuitive interface for intelligent agent management</i>
</div>