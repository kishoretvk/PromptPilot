@echo off
REM setup-windows.bat
REM One-click setup script for PromptPilot on Windows

echo 🚀 Setting up PromptPilot...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    exit /b 1
)

REM Create virtual environment
echo 🔧 Creating virtual environment...
python -m venv .venv

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Upgrade pip
echo 📦 Upgrading pip...
python -m pip install --upgrade pip

REM Install Python dependencies
echo 🐍 Installing Python dependencies...
pip install -r requirements.txt

REM Navigate to UI directory
echo 🎨 Installing frontend dependencies...
cd ui\dashboard

REM Install Node dependencies
npm install --legacy-peer-deps

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Database Configuration
        echo DATABASE_URL=sqlite:///../data/promptpilot.db
        echo.
        echo # API Keys (add your keys here)
        echo OPENAI_API_KEY=
        echo ANTHROPIC_API_KEY=
        echo GOOGLE_API_KEY=
        echo.
        echo # Security
        echo SECRET_KEY=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%
        echo JWT_EXPIRATION_HOURS=24
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_REQUESTS_PER_MINUTE=100
        echo.
        echo # Environment
        echo ENVIRONMENT=development
    ) > .env
)

REM Go back to root directory
cd ..\..

REM Create data directory
mkdir data 2>nul

REM Create default prompts and providers
echo 🎭 Adding default prompts and providers...
python -c "import sys; sys.path.append('api'); from database import init_db; init_db(); print('✅ Database initialized')"

REM Build frontend
echo 🔨 Building frontend...
cd ui\dashboard
npm run build

echo ✅ Setup complete!
echo.
echo To start PromptPilot:
echo 1. Terminal 1: Start backend
echo    cd ..\.. ^&^& call .venv\Scripts\activate.bat ^&^& python -m api.rest
echo.
echo 2. Terminal 2: Serve frontend
echo    cd build ^&^& python -m http.server 3000
echo.
echo Then open http://localhost:3000 in your browser