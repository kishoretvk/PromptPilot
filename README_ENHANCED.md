# PromptPilot

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68.0%2B-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0%2B-blue)](https://reactjs.org/)

PromptPilot is a modular, production-ready framework for managing, testing, and deploying LLM prompts and complex prompt pipelines. It enables developers and AI engineers to version, orchestrate, evaluate, and scale prompt-based workflows across multiple LLM providers.

<p align="center">
  <img src="assets/logo.png" alt="PromptPilot Logo" width="200">
</p>

---

## 🚀 Features

### Core Functionality
- **Hierarchical Prompt Modeling**: Advanced prompt structure with variables, versioning, and test cases
- **Multi-Backend Storage**: File system, Git (with full versioning), and in-memory storage options
- **Unified LLM Provider Abstraction**: Seamless integration with OpenAI, Anthropic, Ollama, Gemini, and more
- **Advanced Pipeline Orchestration**: Complex workflows with error handling, branching, retries, and async execution
- **Comprehensive Version Control**: Git-like versioning for prompts with branching and merging capabilities

### Developer Experience
- **Multiple Interfaces**: CLI, REST API, and Python SDK for flexible integration
- **Real-time Analytics**: Usage tracking, evaluation metrics, and prompt quality scoring
- **Agent Framework Integration**: Ready-to-use scaffolding for LangChain, Haystack, and custom agents
- **Web Dashboard**: Modern React UI for visual prompt management and pipeline design
- **Extensive Documentation**: Comprehensive guides, API references, and examples

### Production Ready
- **Docker Deployment**: Pre-configured docker-compose for easy deployment
- **Monitoring & Observability**: Built-in Prometheus metrics and Grafana dashboards
- **Security Features**: JWT authentication, rate limiting, and API key management
- **Scalable Architecture**: Designed for high-performance with async/await patterns
- **CI/CD Ready**: GitHub Actions workflows and automated testing

---

## 📦 Installation

### Quick Start (Docker - Recommended)
```bash
# Clone the repository
git clone https://github.com/kishoretvk/PromptPilot.git
cd PromptPilot

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Grafana: http://localhost:3001 (admin/admin)
```

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/kishoretvk/PromptPilot.git
cd PromptPilot

# Backend setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ui/dashboard
npm install
cd ../..

# Start services
# Terminal 1: Backend
uvicorn api.rest:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd ui/dashboard
npm start
```

---

## 🎯 Quick Examples

### 1. Using the CLI
```bash
# List all prompts
python -m cli.main --storage file list

# Create a new prompt
python -m cli.main --storage file create --name "Text Summarizer" --task-type "summarization"

# Test a prompt
python -m cli.main --storage file test --prompt-id "prompt-123" --input "Your text here"
```

### 2. Using the REST API
```bash
# Get all prompts
curl http://localhost:8000/api/v1/prompts

# Create a new prompt
curl -X POST http://localhost:8000/api/v1/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Review Assistant",
    "description": "Helps review code for best practices",
    "task_type": "code_review",
    "messages": [
      {
        "role": "system",
        "content": "You are a senior software engineer reviewing code..."
      }
    ]
  }'
```

### 3. Using the Python SDK
```python
from prompt.sdk import PromptPilotClient

# Initialize client
client = PromptPilotClient(base_url="http://localhost:8000")

# List prompts
prompts = client.list_prompts()

# Create a new prompt
new_prompt = client.create_prompt({
    "name": "Story Generator",
    "description": "Creates engaging stories",
    "task_type": "creative_writing",
    "messages": [
        {
            "role": "system",
            "content": "You are a creative writer..."
        }
    ]
})
```

### 4. Advanced Pipeline Example
```python
from prompt.pipeline import AdvancedLLMPipeline, PipelineStep, ErrorStrategy
from prompt.core import Prompt

# Define prompts and steps
pipeline = AdvancedLLMPipeline(
    steps=[
        PipelineStep(
            prompt=summarization_prompt,
            name="summarize"
        ),
        PipelineStep(
            prompt=analysis_prompt,
            name="analyze",
            transform=lambda out: {"summary": out["result"]},
            max_retries=2
        ),
    ],
    error_strategy=ErrorStrategy.RETRY
)

# Run pipeline asynchronously
result = asyncio.run(pipeline.run_async(
    {"text_input": "Your long text here"}, 
    executor
))
```

---

## 🌐 Web Dashboard

PromptPilot includes a modern React-based web dashboard for visual prompt management:

- **Prompt Manager**: Create, edit, and organize prompts with a visual editor
- **Pipeline Builder**: Design complex workflows with drag-and-drop interface
- **Version Control**: Git-like branching and merging for prompt versions
- **Analytics Dashboard**: Monitor usage metrics, costs, and performance
- **Settings & Integrations**: Configure LLM providers, API keys, and preferences

Access the dashboard at: http://localhost:3000

---

## 📊 Monitoring & Observability

PromptPilot includes built-in monitoring capabilities:

- **Prometheus Metrics**: http://localhost:8001/metrics
- **Grafana Dashboards**: Pre-configured dashboards for prompt usage, performance, and costs
- **Structured Logging**: JSON-formatted logs for easy parsing and analysis
- **Health Checks**: Comprehensive health endpoints for all services

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
# Application Settings
APP_NAME=PromptPilot
APP_VERSION=1.0.0
DEBUG=false
SECRET_KEY=your-super-secret-key-here

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/promptpilot

# LLM Provider API Keys
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Security Settings
JWT_SECRET_KEY=your-jwt-secret-key
```

For a complete list of configuration options, see [PRODUCTION_SETUP_GUIDE.md](PRODUCTION_SETUP_GUIDE.md).

---

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [User Guide](docs/user-guide.md)
- [API Documentation](http://localhost:8000/docs) (when running)
- [CLI Documentation](docs/cli.md)
- [Python SDK Guide](docs/python-api.md)
- [Production Deployment](PRODUCTION_SETUP_GUIDE.md)

---

## 🛠️ Development

### Project Structure
```
PromptPilot/
├── api/           # REST API and SDK
├── cli/           # Command-line interface
├── docs/          # Documentation
├── examples/      # Example notebooks
├── llm/           # LLM provider abstraction
├── prompt/        # Core prompt logic
├── ui/dashboard/  # React web dashboard
└── tests/         # Test suite
```

### Running Tests
```bash
# Backend tests
pytest tests/

# Frontend tests
cd ui/dashboard
npm test
```

### Contributing
We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 🚀 Roadmap

- [x] Core prompt management and storage
- [x] REST API and Python SDK
- [x] Web dashboard (React)
- [x] Pipeline orchestration
- [x] Analytics and evaluation
- [x] Production deployment (Docker)
- [ ] POML (Prompt Object Markup Language) integration
- [ ] Advanced analytics and visualization
- [ ] Expanded agent framework integrations
- [ ] Enhanced testing with real LLM providers

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape PromptPilot
- Inspired by the need for better prompt engineering tools in the AI community
- Built with [FastAPI](https://fastapi.tiangolo.com/), [React](https://reactjs.org/), and [PostgreSQL](https://www.postgresql.org/)