# PromptPilot

**The Ultimate Prompt Engineering and LLM Workflow Platform**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18%2B-blue.svg)](https://reactjs.org/)

PromptPilot is a production-ready platform for managing prompts, building LLM workflows, and analyzing performance. It provides a complete solution for teams working with large language models.

## 🚀 Features

### Prompt Management
- **Prompt Version Control**: Full Git-like versioning with branching and merging
- **Prompt Testing**: Built-in testing interface with variable substitution
- **Prompt Comparison**: Visual diff between prompt versions
- **Prompt Organization**: Tagging, search, and categorization

### Workflow Builder
- **Visual Pipeline Editor**: Drag-and-drop interface for building LLM workflows
- **Multi-step Workflows**: Complex pipelines with conditional logic
- **Error Handling**: Configurable error strategies (fail-fast, retry, continue)
- **Real-time Execution**: Live pipeline execution tracking

### Analytics & Monitoring
- **Usage Metrics**: Track prompt and pipeline usage
- **Performance Analytics**: Monitor execution times and success rates
- **Cost Analysis**: Track and optimize LLM costs
- **Provider Performance**: Compare performance across different LLM providers

### Security & Compliance
- **Authentication**: JWT-based authentication with role-based access
- **API Keys**: Secure API key management with rate limiting
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization

### Integrations
- **Multiple LLM Providers**: OpenAI, Anthropic, Google, Hugging Face, and more
- **Database Support**: PostgreSQL, MySQL, and SQLite
- **Observability**: Prometheus metrics and structured logging
- **Deployment**: Docker support for easy deployment

## 🎯 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (optional, SQLite included for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/promptpilot.git
cd promptpilot

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd ui/dashboard
npm install

# Start the development servers
# Terminal 1: Start backend
cd ../..
python -m api.rest

# Terminal 2: Start frontend
cd ui/dashboard
npm start
```

### One-Click Setup

For Windows:
```bash
setup-windows.bat
```

For Linux/Mac:
```bash
chmod +x setup-linux.sh
./setup-linux.sh
```

## 📊 Demo & Screenshots

### Prompt Manager
![Prompt Manager](docs/screenshots/HomePage.png)
*Create, edit, and test prompts with a rich text editor*

### Pipeline Builder
![Pipeline Builder](docs/screenshots/PromptBuilder.png)
*Visual workflow editor for building complex LLM pipelines*

### Analytics Dashboard
![Analytics Dashboard](docs/screenshots/AnalyticsDashboard.png)
*Comprehensive analytics for monitoring performance and costs*

### Pormpt History
![Pormpt History](docs/screenshots/promptHistroy.png)
*Comprehensive  prompt tracking for versioning and historys*



## 🛠️ Architecture

PromptPilot follows a modern microservices-inspired architecture:

```
┌─────────────────┐    ┌──────────────────┐
│   React Frontend│────│  FastAPI Backend │
└─────────────────┘    └──────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
              ┌─────▼──┐ ┌────▼────┐ ┌──▼─────┐
              │Database│ │Message  │ │Storage │
              └────────┘ │ Queue   │ └────────┘
                         └─────────┘
```

### Backend Components
- **FastAPI**: High-performance API framework
- **SQLAlchemy**: Database ORM
- **Redis**: Caching and message queue
- **Celery**: Background task processing

### Frontend Components
- **React 18**: Modern UI library
- **Material-UI**: Component library
- **React Query**: Server state management
- **React Flow**: Workflow visualization

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/promptpilot

# API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Security
SECRET_KEY=your-secret-key
JWT_EXPIRATION_HOURS=24

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

### Production Deployment

Using Docker:
```bash
docker-compose up -d
```

Manual deployment:
```bash
# Build frontend
cd ui/dashboard
npm run build

# Start backend
cd ../..
uvicorn api.rest:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📈 Roadmap

### v1.0 - Core Features ✅
- [x] Prompt management with version control
- [x] Pipeline builder with visual editor
- [x] Analytics dashboard
- [x] Authentication and authorization
- [x] Multi-provider LLM support

### v1.1 - Advanced Features
- [ ] Real-time collaboration
- [ ] Prompt marketplace
- [ ] Advanced analytics with forecasting
- [ ] Custom LLM provider integration

### v1.2 - Enterprise Features
- [ ] Team and organization management
- [ ] Audit logging
- [ ] Advanced security features
- [ ] SLA monitoring

## 📚 Documentation

- [User Guide](docs/USER_GUIDE.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Monitoring and Observability](docs/monitoring.md)
- [Database Migrations](docs/database-migrations.md)
- [Backup and Restore](docs/backup-restore.md)
- [Configuration Management](docs/configuration.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape PromptPilot
- Inspired by the amazing work of the LLM and prompt engineering community

## 📞 Support

For support, please open an issue on GitHub or contact us here.
