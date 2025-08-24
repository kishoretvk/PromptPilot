#!/bin/bash
# setup-linux.sh
# One-click setup script for PromptPilot on Linux/Mac

echo "🚀 Setting up PromptPilot..."

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Create virtual environment
echo "🔧 Creating virtual environment..."
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install -r requirements.txt

# Navigate to UI directory
echo "🎨 Installing frontend dependencies..."
cd ui/dashboard

# Install Node dependencies
npm install --legacy-peer-deps

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=sqlite:///../data/promptpilot.db

# API Keys (add your keys here)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Security
SECRET_KEY=$(openssl rand -hex 32)
JWT_EXPIRATION_HOURS=24

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# Environment
ENVIRONMENT=development
EOF
fi

# Go back to root directory
cd ../..

# Create data directory
mkdir -p data

# Create default prompts and providers
echo "🎭 Adding default prompts and providers..."
python -c "
import sys
sys.path.append('api')
from database import init_db
init_db()
print('✅ Database initialized')
"

# Build frontend
echo "🔨 Building frontend..."
cd ui/dashboard
npm run build

echo "✅ Setup complete!"
echo ""
echo "To start PromptPilot:"
echo "1. Terminal 1: Start backend"
echo "   cd ../.. && source .venv/bin/activate && python -m api.rest"
echo ""
echo "2. Terminal 2: Serve frontend"
echo "   cd build && python -m http.server 3000"
echo ""
echo "Then open http://localhost:3000 in your browser"