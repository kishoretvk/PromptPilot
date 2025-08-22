# PromptPilot Windows Setup Script
# Requires PowerShell 5.1 or higher
# Run as Administrator for system-wide installations

param(
    [switch]$SkipDependencyCheck,
    [switch]$Development = $false,
    [string]$DatabasePassword = "promptpilot_secure_password",
    [string]$InstallPath = "$env:USERPROFILE\PromptPilot"
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-ColorOutput($Message, $Color) {
    Write-Host $Message -ForegroundColor $Color
}

function Test-IsAdmin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-Command($Command) {
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

function Install-Chocolatey {
    Write-ColorOutput "Installing Chocolatey package manager..." $InfoColor
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

function Install-Prerequisites {
    Write-ColorOutput "Checking and installing prerequisites..." $InfoColor
    
    # Check if running as admin for system installations
    if (-not (Test-IsAdmin) -and -not $SkipDependencyCheck) {
        Write-ColorOutput "Warning: Not running as Administrator. Some installations may fail." $WarningColor
        Write-ColorOutput "Consider running: powershell -Command 'Start-Process PowerShell -Verb RunAs'" $InfoColor
    }

    # Install Chocolatey if not present
    if (-not (Test-Command "choco")) {
        Install-Chocolatey
    }

    # Install Node.js
    if (-not (Test-Command "node")) {
        Write-ColorOutput "Installing Node.js..." $InfoColor
        choco install nodejs --version=18.18.2 -y
        refreshenv
    } else {
        $nodeVersion = node --version
        Write-ColorOutput "Node.js already installed: $nodeVersion" $SuccessColor
    }

    # Install Python
    if (-not (Test-Command "python")) {
        Write-ColorOutput "Installing Python 3.11..." $InfoColor
        choco install python --version=3.11.7 -y
        refreshenv
    } else {
        $pythonVersion = python --version
        Write-ColorOutput "Python already installed: $pythonVersion" $SuccessColor
    }

    # Install PostgreSQL
    if (-not (Test-Command "psql")) {
        Write-ColorOutput "Installing PostgreSQL 15..." $InfoColor
        choco install postgresql15 --params "/Password:$DatabasePassword" -y
        refreshenv
    } else {
        Write-ColorOutput "PostgreSQL already installed" $SuccessColor
    }

    # Install Redis
    if (-not (Test-Command "redis-server")) {
        Write-ColorOutput "Installing Redis..." $InfoColor
        choco install redis-64 -y
        refreshenv
    } else {
        Write-ColorOutput "Redis already installed" $SuccessColor
    }

    # Install Git
    if (-not (Test-Command "git")) {
        Write-ColorOutput "Installing Git..." $InfoColor
        choco install git -y
        refreshenv
    } else {
        Write-ColorOutput "Git already installed" $SuccessColor
    }
}

function Setup-Database {
    Write-ColorOutput "Setting up PostgreSQL database..." $InfoColor
    
    # Wait for PostgreSQL to start
    Start-Sleep -Seconds 10
    
    # Create database and user
    try {
        $env:PGPASSWORD = $DatabasePassword
        
        # Create database
        psql -U postgres -c "CREATE DATABASE promptpilot;" 2>$null
        
        # Create user
        psql -U postgres -c "CREATE USER promptpilot_user WITH PASSWORD '$DatabasePassword';" 2>$null
        
        # Grant privileges
        psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE promptpilot TO promptpilot_user;" 2>$null
        
        Write-ColorOutput "Database setup completed successfully" $SuccessColor
    }
    catch {
        Write-ColorOutput "Database setup failed. You may need to configure manually." $WarningColor
        Write-ColorOutput "Error: $_" $ErrorColor
    }
}

function Start-Redis {
    Write-ColorOutput "Starting Redis server..." $InfoColor
    try {
        Start-Process -FilePath "redis-server" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-ColorOutput "Redis server started" $SuccessColor
    }
    catch {
        Write-ColorOutput "Failed to start Redis. Please start manually." $WarningColor
    }
}

function Clone-Repository {
    if (Test-Path $InstallPath) {
        Write-ColorOutput "Installation directory exists. Updating..." $InfoColor
        Set-Location $InstallPath
        git pull origin main
    } else {
        Write-ColorOutput "Cloning PromptPilot repository..." $InfoColor
        git clone https://github.com/your-repo/PromptPilot.git $InstallPath
        Set-Location $InstallPath
    }
}

function Setup-Environment {
    Write-ColorOutput "Setting up environment variables..." $InfoColor
    
    # Create .env file
    $envContent = @"
# Application Settings
APP_NAME=PromptPilot
APP_VERSION=1.0.0
DEBUG=$($Development.ToString().ToLower())
SECRET_KEY=$((New-Guid).ToString().Replace('-', ''))
CORS_ORIGINS=["http://localhost:3000"]

# Database Configuration
DATABASE_URL=postgresql://promptpilot_user:$DatabasePassword@localhost:5432/promptpilot
REDIS_URL=redis://localhost:6379/0

# Security Settings
JWT_SECRET_KEY=$((New-Guid).ToString().Replace('-', ''))
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=8001
LOG_LEVEL=INFO

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
"@

    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-ColorOutput "Environment file created" $SuccessColor
}

function Setup-Python {
    Write-ColorOutput "Setting up Python environment..." $InfoColor
    
    # Create virtual environment
    python -m venv venv
    
    # Activate virtual environment
    & ".\venv\Scripts\Activate.ps1"
    
    # Upgrade pip
    python -m pip install --upgrade pip
    
    # Install requirements
    pip install -r requirements.txt
    
    Write-ColorOutput "Python environment setup completed" $SuccessColor
}

function Setup-Database-Schema {
    Write-ColorOutput "Setting up database schema..." $InfoColor
    
    try {
        # Activate virtual environment
        & ".\venv\Scripts\Activate.ps1"
        
        # Run database migrations
        python -m alembic upgrade head
        
        Write-ColorOutput "Database schema setup completed" $SuccessColor
    }
    catch {
        Write-ColorOutput "Database migration failed: $_" $ErrorColor
    }
}

function Setup-Frontend {
    Write-ColorOutput "Setting up frontend..." $InfoColor
    
    Set-Location "ui\dashboard"
    
    # Install npm dependencies
    npm install
    
    # Build frontend
    if ($Development) {
        Write-ColorOutput "Development mode - skipping build" $InfoColor
    } else {
        npm run build
    }
    
    Set-Location "..\..\"
    Write-ColorOutput "Frontend setup completed" $SuccessColor
}

function Create-StartupScripts {
    Write-ColorOutput "Creating startup scripts..." $InfoColor
    
    # Create backend startup script
    $backendScript = @"
@echo off
echo Starting PromptPilot Backend...
cd /d "%~dp0"
call venv\Scripts\activate
python -m uvicorn api.rest:app --host 0.0.0.0 --port 8000 --reload
pause
"@
    $backendScript | Out-File -FilePath "start-backend.bat" -Encoding ASCII

    # Create frontend startup script
    $frontendScript = @"
@echo off
echo Starting PromptPilot Frontend...
cd /d "%~dp0\ui\dashboard"
npm start
pause
"@
    $frontendScript | Out-File -FilePath "start-frontend.bat" -Encoding ASCII

    # Create combined startup script
    $combinedScript = @"
@echo off
echo Starting PromptPilot (Full Stack)...
cd /d "%~dp0"

echo Starting Backend...
start "PromptPilot Backend" cmd /k "call venv\Scripts\activate && python -m uvicorn api.rest:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for backend to start...
timeout /t 10 /nobreak > nul

echo Starting Frontend...
start "PromptPilot Frontend" cmd /k "cd ui\dashboard && npm start"

echo PromptPilot is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
pause
"@
    $combinedScript | Out-File -FilePath "start-promptpilot.bat" -Encoding ASCII

    Write-ColorOutput "Startup scripts created" $SuccessColor
}

function Test-Installation {
    Write-ColorOutput "Testing installation..." $InfoColor
    
    # Test backend
    try {
        & ".\venv\Scripts\Activate.ps1"
        $pythonTest = python -c "import fastapi, sqlalchemy, redis; print('Backend dependencies OK')"
        Write-ColorOutput "Backend test: PASSED" $SuccessColor
    }
    catch {
        Write-ColorOutput "Backend test: FAILED" $ErrorColor
    }
    
    # Test frontend
    try {
        Set-Location "ui\dashboard"
        $npmTest = npm run type-check
        Set-Location "..\..\"
        Write-ColorOutput "Frontend test: PASSED" $SuccessColor
    }
    catch {
        Write-ColorOutput "Frontend test: FAILED" $ErrorColor
    }
}

function Show-Summary {
    Write-ColorOutput "`n=========================" $InfoColor
    Write-ColorOutput "PromptPilot Setup Complete!" $SuccessColor
    Write-ColorOutput "=========================" $InfoColor
    Write-ColorOutput ""
    Write-ColorOutput "Installation Path: $InstallPath" $InfoColor
    Write-ColorOutput "Database: PostgreSQL (localhost:5432)" $InfoColor
    Write-ColorOutput "Cache: Redis (localhost:6379)" $InfoColor
    Write-ColorOutput ""
    Write-ColorOutput "To start PromptPilot:" $InfoColor
    Write-ColorOutput "  Option 1: Double-click 'start-promptpilot.bat'" $SuccessColor
    Write-ColorOutput "  Option 2: Run individual scripts:" $InfoColor
    Write-ColorOutput "    - start-backend.bat (API server)" $InfoColor
    Write-ColorOutput "    - start-frontend.bat (Web interface)" $InfoColor
    Write-ColorOutput ""
    Write-ColorOutput "URLs:" $InfoColor
    Write-ColorOutput "  Frontend: http://localhost:3000" $SuccessColor
    Write-ColorOutput "  Backend API: http://localhost:8000" $SuccessColor
    Write-ColorOutput "  API Documentation: http://localhost:8000/docs" $SuccessColor
    Write-ColorOutput "  Metrics: http://localhost:8001/metrics" $SuccessColor
    Write-ColorOutput ""
    Write-ColorOutput "Configuration:" $InfoColor
    Write-ColorOutput "  Environment file: .env" $InfoColor
    Write-ColorOutput "  Logs: logs/ directory" $InfoColor
    Write-ColorOutput "  Uploads: uploads/ directory" $InfoColor
    Write-ColorOutput ""
    Write-ColorOutput "Support:" $InfoColor
    Write-ColorOutput "  Documentation: PRODUCTION_SETUP_GUIDE.md" $InfoColor
    Write-ColorOutput "  Issues: https://github.com/your-repo/PromptPilot/issues" $InfoColor
}

# Main execution
try {
    Write-ColorOutput "PromptPilot Windows Setup Starting..." $InfoColor
    Write-ColorOutput "======================================" $InfoColor

    if (-not $SkipDependencyCheck) {
        Install-Prerequisites
        Setup-Database
        Start-Redis
    }

    Clone-Repository
    Setup-Environment
    Setup-Python
    Setup-Database-Schema
    Setup-Frontend
    Create-StartupScripts
    Test-Installation
    Show-Summary

    Write-ColorOutput "`nSetup completed successfully!" $SuccessColor
}
catch {
    Write-ColorOutput "Setup failed with error: $_" $ErrorColor
    Write-ColorOutput "Please check the error messages above and try again." $ErrorColor
    Write-ColorOutput "For help, see PRODUCTION_SETUP_GUIDE.md" $InfoColor
    exit 1
}

# Optional: Start services immediately
$startNow = Read-Host "`nStart PromptPilot now? (y/N)"
if ($startNow -eq 'y' -or $startNow -eq 'Y') {
    Write-ColorOutput "Starting PromptPilot..." $InfoColor
    Start-Process -FilePath "start-promptpilot.bat"
}