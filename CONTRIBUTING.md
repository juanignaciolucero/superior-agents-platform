# Contributing to Superior Agents Platform

Thank you for your interest in contributing to the Superior Agents Platform! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.18.0
- **Python** >= 3.9
- **Docker** (for agent deployment)
- **Git**

### Development Setup

1. **Fork and Clone**
```bash
git clone https://github.com/your-username/superior-agents-platform.git
cd superior-agents-platform
```

2. **Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Runtime Agent
cd ../backend/runtime-agent
pip install -r requirements.txt
```

3. **Environment Setup**
```bash
# Copy environment template
cp backend/.env.example backend/.env
# Edit with your API keys
```

4. **Start Development Servers**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

## 📋 Contribution Guidelines

### Code Style

#### JavaScript/TypeScript
- Use **ESLint** configuration provided
- Follow **Prettier** formatting
- Use **TypeScript** with strict typing
- Avoid `any` types when possible

#### Python
- Follow **PEP 8** style guidelines
- Use **type hints** for all functions
- Write **docstrings** for classes and functions
- Use **pytest** for testing

### Commit Messages

Use conventional commit format:
```
type(scope): description

Examples:
feat(frontend): add agent configuration modal
fix(backend): resolve MCP validation error
docs(readme): update installation instructions
refactor(runtime): improve prompt generation logic
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Branch Naming

Use descriptive branch names:
```
feature/agent-configuration-ui
fix/mcp-validation-bug
improvement/dashboard-performance
docs/api-documentation
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Runtime agent tests
cd backend/runtime-agent
python -m pytest tests/
```

### Writing Tests

- Write tests for new features
- Maintain test coverage above 80%
- Include both unit and integration tests
- Test error scenarios and edge cases

Example test structure:
```typescript
// frontend/__tests__/components/Dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import Dashboard from '@/components/Dashboard'

describe('Dashboard', () => {
  test('renders correctly', () => {
    render(<Dashboard onCreateAgent={() => {}} />)
    expect(screen.getByText('Agent Dashboard')).toBeInTheDocument()
  })
})
```

## 🔧 Development Workflows

### Adding New Features

1. **Create Issue**: Describe the feature and get feedback
2. **Create Branch**: `git checkout -b feature/your-feature-name`
3. **Develop**: Write code following style guidelines
4. **Test**: Add tests and ensure all tests pass
5. **Document**: Update relevant documentation
6. **Pull Request**: Submit PR with clear description

### Bug Fixes

1. **Reproduce Bug**: Create a test that demonstrates the bug
2. **Fix Bug**: Implement the minimal fix
3. **Verify Fix**: Ensure the test passes
4. **Regression Test**: Check that nothing else breaks

### Adding New MCPs

1. **MCP Server**: Implement following MCP protocol
```python
# mcps/your-mcp/server.py
class YourMCPServer:
    def __init__(self):
        self.name = "Your MCP"
        self.version = "1.0.0"
    
    async def handle_request(self, request):
        # Implementation
        pass
```

2. **Catalog Entry**: Add to backend catalog
```javascript
// backend/mcpCatalog.js
{
  id: 'your-mcp',
  name: 'Your MCP',
  description: 'Description of your MCP',
  category: 'Category',
  config: {
    configFields: [
      {
        key: 'API_KEY',
        label: 'API Key',
        type: 'text',
        required: true,
        description: 'Your service API key'
      }
    ]
  }
}
```

3. **Frontend Integration**: Update UI components if needed

### Adding New LLM Providers

1. **Genner Implementation**:
```python
# backend/runtime-agent/src/genner/YourLLM.py
from genner.Base import BaseGenner

class YourLLMGenner(BaseGenner):
    async def generate(self, prompt: str, **kwargs) -> str:
        # Implementation
        pass
```

2. **Registration**:
```python
# backend/runtime-agent/src/genner/__init__.py
LLM_PROVIDERS['your-llm'] = YourLLMGenner
```

## 📚 Documentation

### README Updates
- Keep README.md files current
- Update installation instructions if needed
- Add examples for new features

### Code Documentation
- Document all public functions and classes
- Use JSDoc for JavaScript/TypeScript
- Use docstrings for Python
- Include usage examples

### API Documentation
- Update OpenAPI/Swagger specs for new endpoints
- Include request/response examples
- Document error responses

## 🐛 Reporting Issues

### Bug Reports
Include:
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Node.js version, Python version
- **Screenshots**: If applicable

### Feature Requests
Include:
- **Use Case**: Why is this feature needed?
- **Description**: Detailed feature description
- **Mockups**: UI mockups if applicable
- **Alternatives**: Alternative solutions considered

## 🏗️ Architecture Guidelines

### Backend (Node.js)
- Use **Express.js** for API routes
- Implement **proper error handling**
- Use **async/await** for asynchronous code
- Follow **RESTful API** principles

### Frontend (Next.js)
- Use **React hooks** for state management
- Implement **TypeScript interfaces**
- Follow **component composition** patterns
- Use **Tailwind CSS** for styling

### Runtime Agent (Python)
- Use **async/await** for concurrent operations
- Implement **proper error handling**
- Follow **dependency injection** patterns
- Use **type hints** throughout

## 🔒 Security Guidelines

### API Keys and Secrets
- Never commit API keys to repository
- Use environment variables for configuration
- Implement proper validation for inputs
- Sanitize user inputs to prevent XSS

### Container Security
- Use minimal Docker images
- Implement resource limits
- Validate code before execution
- Isolate agent execution environments

## 🚀 Deployment Guidelines

### Development
- Use environment-specific configurations
- Test locally before submitting PR
- Verify Docker builds work correctly

### Production
- Use production-grade database
- Implement proper monitoring
- Use HTTPS for all communications
- Implement rate limiting

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time community chat (coming soon)

### Code Review Process
1. **Self Review**: Review your own code first
2. **Automated Checks**: Ensure CI passes
3. **Peer Review**: Address reviewer feedback
4. **Maintainer Review**: Final approval from maintainers

## 🎉 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Invited to maintainer team (for significant contributions)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Superior Agents Platform! 🚀