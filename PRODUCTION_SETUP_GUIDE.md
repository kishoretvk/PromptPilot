# PromptPilot Production Setup Guide

## Overview

PromptPilot is a comprehensive LLM prompt engineering and workflow platform built with FastAPI (backend) and React (frontend). This guide provides step-by-step instructions for setting up PromptPilot in production environments.

## Architecture Overview

```mermaid
graph TB
    A[Frontend - React] --> B[Backend - FastAPI]
    B --> C[Database - PostgreSQL]
    B --> D[Cache - Redis]
    B --> E[LLM Providers]
    E --> E1[OpenAI]
    E --> E2[Anthropic]
    E --> E3[Local Models]
    B --> F[Monitoring]
    F --> F1[Prometheus]
    F --> F2[Grafana]
```

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB available space
- **OS**: Windows 10/11, Ubuntu 20.04+, macOS 12+

### Recommended Requirements
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 100GB SSD
- **OS**: Ubuntu 22.04 LTS (for production servers)

### Software Dependencies
- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **PostgreSQL**: 15.x or higher
- **Redis**: 7.x or higher
- **Docker**: 24.x (optional but recommended)
- **Git**: Latest version

## Quick Start (One-Click Setup)

### Windows
```powershell
# Download and run the setup script
powershell -ExecutionPolicy Bypass -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/your-repo/PromptPilot/main/setup-windows.ps1' -OutFile 'setup.ps1'; .\setup.ps1}"
```

### Linux/macOS
```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/PromptPilot/main/setup-unix.sh | bash
```

## Manual Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/your-repo/PromptPilot.git
cd PromptPilot
```

### Step 2: Backend Setup

#### Install Python Dependencies
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Required variables:
# - DATABASE_URL
# - REDIS_URL
# - SECRET_KEY
# - OPENAI_API_KEY (optional)
# - ANTHROPIC_API_KEY (optional)
```

#### Database Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE promptpilot;
CREATE USER promptpilot_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE promptpilot TO promptpilot_user;
\q

# Run database migrations
python -m alembic upgrade head
```

#### Redis Setup
```bash
# Install Redis (Ubuntu/Debian)
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Step 3: Frontend Setup

#### Install Node.js Dependencies
```bash
cd ui/dashboard
npm install
```

#### Build Frontend
```bash
# Development build
npm run build:dev

# Production build
npm run build
```

### Step 4: Start Services

#### Start Backend
```bash
# Development
uvicorn api.rest:app --host 0.0.0.0 --port 8000 --reload

# Production
uvicorn api.rest:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Start Frontend
```bash
cd ui/dashboard

# Development
npm start

# Production (serve built files)
npm run serve
```

## Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Container Deployment
```bash
# Build backend image
docker build -t promptpilot-backend .

# Build frontend image
docker build -t promptpilot-frontend ./ui/dashboard

# Run with environment variables
docker run -d \
  --name promptpilot-backend \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/promptpilot \
  -e REDIS_URL=redis://host:6379 \
  promptpilot-backend
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Application Settings
APP_NAME=PromptPilot
APP_VERSION=1.0.0
DEBUG=false
SECRET_KEY=your-super-secret-key-here
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]

# Database Configuration
DATABASE_URL=postgresql://promptpilot_user:password@localhost:5432/promptpilot
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=your-redis-password

# LLM Provider API Keys
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
HUGGINGFACE_API_TOKEN=hf_your-huggingface-token

# Security Settings
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST_SIZE=200

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=8001
LOG_LEVEL=INFO
SENTRY_DSN=your-sentry-dsn-here

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Email Configuration (for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Frontend (.env.production)
```env
REACT_APP_API_URL=https://api.promptpilot.com
REACT_APP_WS_URL=wss://api.promptpilot.com/ws
REACT_APP_APP_NAME=PromptPilot
REACT_APP_VERSION=1.0.0
REACT_APP_SENTRY_DSN=your-frontend-sentry-dsn
REACT_APP_GA_TRACKING_ID=GA-XXXXXXXXX
```

### Nginx Configuration (Production)
```nginx
# /etc/nginx/sites-available/promptpilot
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend
    location / {
        root /var/www/promptpilot/ui/dashboard/build;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Schema

### Initial Setup
```sql
-- Create database
CREATE DATABASE promptpilot;

-- Create user
CREATE USER promptpilot_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE promptpilot TO promptpilot_user;

-- Connect to database
\c promptpilot;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

### Schema Migration
```bash
# Generate migration
python -m alembic revision --autogenerate -m "Initial schema"

# Apply migration
python -m alembic upgrade head

# Rollback migration
python -m alembic downgrade -1
```

## Default Data Setup

The system automatically creates default prompts and LLM provider configurations on first startup:

### Default Prompts
- **Text Summarization**: General purpose text summarization
- **Code Generation**: Programming assistance prompts
- **Creative Writing**: Story and content generation
- **Data Analysis**: Data interpretation and insights
- **Translation**: Multi-language translation prompts

### Default LLM Providers
- **OpenAI**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **Anthropic**: Claude-3-sonnet, Claude-3-opus
- **Local Models**: Ollama integration support

## Monitoring & Observability

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Detailed health check
curl http://localhost:8000/health/detailed
```

### Metrics Endpoints
- **Prometheus Metrics**: http://localhost:8001/metrics
- **Application Metrics**: http://localhost:8000/api/metrics
- **Database Health**: http://localhost:8000/health/db
- **Redis Health**: http://localhost:8000/health/redis

### Log Files
```bash
# Application logs
tail -f logs/app.log

# Error logs  
tail -f logs/error.log

# Access logs
tail -f logs/access.log
```

## Security Configuration

### JWT Token Configuration
```python
# JWT settings in .env
JWT_SECRET_KEY=your-256-bit-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

### API Key Management
```bash
# Create API key for external integrations
curl -X POST http://localhost:8000/api/auth/api-keys \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "External Integration", "permissions": ["read", "write"]}'
```

### Rate Limiting
```python
# Configure in .env
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST_SIZE=200
RATE_LIMIT_ENABLED=true
```

## Performance Optimization

### Database Optimization
```sql
-- Index creation for better performance
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
CREATE INDEX idx_prompts_task_type ON prompts(task_type);
CREATE INDEX idx_pipeline_executions_status ON pipeline_executions(status);
```

### Redis Caching
```python
# Cache configuration
REDIS_CACHE_TTL=3600  # 1 hour
REDIS_SESSION_TTL=86400  # 24 hours
```

### Frontend Optimization
```bash
# Enable gzip compression
npm run build:optimize

# Generate service worker
npm run generate-sw
```

## Backup & Recovery

### Database Backup
```bash
# Create backup
pg_dump -U promptpilot_user -h localhost promptpilot > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U promptpilot_user -h localhost promptpilot < backup_20240101_120000.sql
```

### File Backup
```bash
# Backup uploads and configurations
tar -czf backup_files_$(date +%Y%m%d).tar.gz uploads/ logs/ .env
```

## Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version

# Check dependencies
pip list

# Check database connection
python -c "import psycopg2; print('PostgreSQL connection OK')"

# Check Redis connection
redis-cli ping
```

#### Frontend Build Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U promptpilot_user -h localhost -d promptpilot -c "SELECT version();"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Log Analysis
```bash
# Check application logs
tail -f logs/app.log | grep ERROR

# Check access patterns
tail -f logs/access.log | grep "POST\|PUT\|DELETE"

# Monitor performance
tail -f logs/app.log | grep "duration"
```

## Maintenance

### Regular Tasks

#### Daily
- Monitor log files for errors
- Check system resource usage
- Verify backup completion
- Review security alerts

#### Weekly  
- Update dependencies (security patches)
- Analyze performance metrics
- Clean up old log files
- Test backup restoration

#### Monthly
- Database maintenance (VACUUM, ANALYZE)
- Security audit
- Performance optimization review
- Update documentation

### Update Procedure
```bash
# 1. Backup current version
./scripts/backup.sh

# 2. Pull latest changes
git pull origin main

# 3. Update dependencies
pip install -r requirements.txt
cd ui/dashboard && npm install

# 4. Run migrations
python -m alembic upgrade head

# 5. Build frontend
cd ui/dashboard && npm run build

# 6. Restart services
sudo systemctl restart promptpilot-backend
sudo systemctl restart nginx
```

## Support & Resources

### Documentation
- [API Documentation](http://localhost:8000/docs)
- [Component Storybook](http://localhost:6006)
- [Development Guide](./DEVELOPMENT.md)

### Community
- [GitHub Issues](https://github.com/your-repo/PromptPilot/issues)
- [Discord Community](https://discord.gg/promptpilot)
- [Documentation Wiki](https://github.com/your-repo/PromptPilot/wiki)

### Professional Support
- Enterprise support available
- Custom integration services
- Training and consulting

---

## Production Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Monitoring setup completed
- [ ] Backup strategy implemented
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Load testing completed

### Post-deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Log aggregation working
- [ ] Backup verification
- [ ] Performance metrics baseline
- [ ] Security scanning completed
- [ ] User acceptance testing
- [ ] Documentation updated

### Ongoing Maintenance
- [ ] Regular security updates
- [ ] Database maintenance schedule
- [ ] Log retention policy
- [ ] Backup retention policy
- [ ] Performance monitoring
- [ ] Capacity planning
- [ ] Incident response plan
- [ ] Change management process

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-22  
**Next Review**: 2024-02-22