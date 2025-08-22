@echo off
setlocal enabledelayedexpansion

REM PromptPilot Startup Script for Windows
REM This script starts both backend and frontend services
REM Supports development and production modes

title PromptPilot Startup

REM Configuration
set BACKEND_PORT=8000
set FRONTEND_PORT=3000
set METRICS_PORT=8001
set LOG_DIR=logs

REM Default mode
set MODE=development

REM Colors (limited in batch)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

REM Function to print status
:print_status
echo %BLUE%[PromptPilot]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Parse command line arguments
set COMMAND=start
:parse_args
if "%1"=="" goto :start_parsing
if "%1"=="start" set COMMAND=start
if "%1"=="stop" set COMMAND=stop
if "%1"=="restart" set COMMAND=restart
if "%1"=="status" set COMMAND=status
if "%1"=="logs" set COMMAND=logs
if "%1"=="health" set COMMAND=health
if "%1"=="install" set COMMAND=install
if "%1"=="help" set COMMAND=help
if "%1"=="--production" set MODE=production
if "%1"=="--dev" set MODE=development
shift
goto :parse_args

:start_parsing

REM Create log directory
if not exist %LOG_DIR% mkdir %LOG_DIR%

REM Main execution
if "%COMMAND%"=="start" goto :cmd_start
if "%COMMAND%"=="stop" goto :cmd_stop
if "%COMMAND%"=="restart" goto :cmd_restart
if "%COMMAND%"=="status" goto :cmd_status
if "%COMMAND%"=="logs" goto :cmd_logs
if "%COMMAND%"=="health" goto :cmd_health
if "%COMMAND%"=="install" goto :cmd_install
if "%COMMAND%"=="help" goto :cmd_help
goto :cmd_help

:cmd_start
call :print_status "Starting PromptPilot in %MODE% mode..."
call :check_dependencies
if errorlevel 1 goto :error_exit

call :setup_python_env
if errorlevel 1 goto :error_exit

call :setup_node_env
if errorlevel 1 goto :error_exit

call :start_backend
if errorlevel 1 goto :error_exit

call :start_metrics

call :start_frontend
if errorlevel 1 goto :error_exit

echo.
call :show_status
echo.
call :print_success "PromptPilot started successfully!"
call :print_status "Press Ctrl+C to stop all services"
call :print_status "Frontend: http://localhost:%FRONTEND_PORT%"
call :print_status "Backend API: http://localhost:%BACKEND_PORT%/docs"
call :print_status "Metrics: http://localhost:%METRICS_PORT%"

REM Keep window open
pause >nul
goto :eof

:cmd_stop
call :stop_services
goto :eof

:cmd_restart
call :stop_services
timeout /t 2 /nobreak >nul
call :cmd_start
goto :eof

:cmd_status
call :show_status
goto :eof

:cmd_logs
call :print_status "Log files available in %LOG_DIR% directory:"
dir /b %LOG_DIR%\*.log 2>nul
goto :eof

:cmd_health
call :health_check
goto :eof

:cmd_install
call :check_dependencies
call :setup_python_env
call :setup_node_env
call :print_success "Dependencies installed successfully"
goto :eof

:cmd_help
echo PromptPilot Startup Script for Windows
echo.
echo Usage: %0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   start         Start all services (default)
echo   stop          Stop all services
echo   restart       Restart all services
echo   status        Show service status
echo   logs          Show available log files
echo   health        Run health checks
echo   install       Install dependencies
echo   help          Show this help message
echo.
echo Options:
echo   --production  Run in production mode
echo   --dev         Run in development mode (default)
echo.
echo Examples:
echo   %0 start --production    # Start in production mode
echo   %0 restart --dev         # Restart in development mode
goto :eof

:check_dependencies
call :print_status "Checking dependencies..."

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Python is not installed or not in PATH"
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js is not installed or not in PATH"
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    call :print_error "npm is not installed or not in PATH"
    exit /b 1
)

call :print_success "All dependencies are available"
goto :eof

:setup_python_env
call :print_status "Setting up Python environment..."

if not exist venv (
    call :print_status "Creating Python virtual environment..."
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/update dependencies
call :print_status "Installing Python dependencies..."
pip install -r requirements.txt >nul 2>&1

call :print_success "Python environment ready"
goto :eof

:setup_node_env
call :print_status "Setting up Node.js environment..."

cd ui\dashboard

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    call :print_status "Installing Node.js dependencies..."
    npm install
) else (
    call :print_status "Node.js dependencies already installed"
)

cd ..\..
call :print_success "Node.js environment ready"
goto :eof

:start_backend
call :print_status "Starting backend server..."

REM Kill any existing process on backend port
call :kill_port %BACKEND_PORT%

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start backend
if "%MODE%"=="production" (
    call :print_status "Starting backend in production mode..."
    start "PromptPilot Backend" /min cmd /c "uvicorn api.rest:app --host 0.0.0.0 --port %BACKEND_PORT% > %LOG_DIR%\backend.log 2>&1"
) else (
    call :print_status "Starting backend in development mode..."
    start "PromptPilot Backend" /min cmd /c "uvicorn api.rest:app --host 0.0.0.0 --port %BACKEND_PORT% --reload > %LOG_DIR%\backend.log 2>&1"
)

REM Wait for backend to start
call :print_status "Waiting for backend to start..."
set /a count=0
:wait_backend
timeout /t 1 /nobreak >nul
set /a count+=1
curl -s http://localhost:%BACKEND_PORT%/health >nul 2>&1
if not errorlevel 1 (
    call :print_success "Backend started successfully on port %BACKEND_PORT%"
    goto :eof
)
if %count% lss 30 goto :wait_backend

call :print_error "Backend failed to start"
exit /b 1

:start_metrics
call :print_status "Starting metrics server..."

REM Kill any existing process on metrics port
call :kill_port %METRICS_PORT%

REM Start metrics server
start "PromptPilot Metrics" /min cmd /c "python -c \"from prometheus_client import start_http_server; import time; start_http_server(%METRICS_PORT%); print('Metrics server started on port %METRICS_PORT%'); [time.sleep(1) for _ in iter(int, 1)]\" > %LOG_DIR%\metrics.log 2>&1"

timeout /t 2 /nobreak >nul
call :print_success "Metrics server started on port %METRICS_PORT%"
goto :eof

:start_frontend
call :print_status "Starting frontend server..."

REM Kill any existing process on frontend port
call :kill_port %FRONTEND_PORT%

cd ui\dashboard

if "%MODE%"=="production" (
    call :print_status "Building frontend for production..."
    npm run build
    call :print_status "Starting frontend in production mode..."
    start "PromptPilot Frontend" /min cmd /c "npx serve -s build -l %FRONTEND_PORT% > ..\..\%LOG_DIR%\frontend.log 2>&1"
) else (
    call :print_status "Starting frontend in development mode..."
    start "PromptPilot Frontend" /min cmd /c "npm start > ..\..\%LOG_DIR%\frontend.log 2>&1"
)

cd ..\..

REM Wait for frontend to start
call :print_status "Waiting for frontend to start..."
set /a count=0
:wait_frontend
timeout /t 1 /nobreak >nul
set /a count+=1
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if not errorlevel 1 (
    call :print_success "Frontend started successfully on port %FRONTEND_PORT%"
    goto :eof
)
if %count% lss 60 goto :wait_frontend

call :print_error "Frontend failed to start"
exit /b 1

:kill_port
REM Kill processes on specified port
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%1" ^| find "LISTENING"') do (
    call :print_warning "Killing process on port %1"
    taskkill /f /pid %%a >nul 2>&1
)
goto :eof

:stop_services
call :print_status "Stopping all services..."

REM Stop processes on all ports
call :kill_port %BACKEND_PORT%
call :kill_port %FRONTEND_PORT%
call :kill_port %METRICS_PORT%

REM Also kill by window title
taskkill /fi "WindowTitle eq PromptPilot Backend" /f >nul 2>&1
taskkill /fi "WindowTitle eq PromptPilot Frontend" /f >nul 2>&1
taskkill /fi "WindowTitle eq PromptPilot Metrics" /f >nul 2>&1

call :print_success "All services stopped"
goto :eof

:show_status
call :print_status "PromptPilot Status:"
echo.

REM Check backend
netstat -an | find ":%BACKEND_PORT%" | find "LISTENING" >nul 2>&1
if not errorlevel 1 (
    call :print_success "✓ Backend running on http://localhost:%BACKEND_PORT%"
    echo   - API Documentation: http://localhost:%BACKEND_PORT%/docs
    echo   - Health Check: http://localhost:%BACKEND_PORT%/health
) else (
    call :print_error "✗ Backend not running"
)

REM Check metrics
netstat -an | find ":%METRICS_PORT%" | find "LISTENING" >nul 2>&1
if not errorlevel 1 (
    call :print_success "✓ Metrics server running on http://localhost:%METRICS_PORT%"
) else (
    call :print_warning "⚠ Metrics server not running"
)

REM Check frontend
netstat -an | find ":%FRONTEND_PORT%" | find "LISTENING" >nul 2>&1
if not errorlevel 1 (
    call :print_success "✓ Frontend running on http://localhost:%FRONTEND_PORT%"
) else (
    call :print_error "✗ Frontend not running"
)

echo.
call :print_status "Logs available in: %LOG_DIR%\"
goto :eof

:health_check
call :print_status "Running health checks..."

curl -s http://localhost:%BACKEND_PORT%/health | find "healthy" >nul 2>&1
if not errorlevel 1 (
    call :print_success "Backend health check passed"
) else (
    call :print_error "Backend health check failed"
)

curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if not errorlevel 1 (
    call :print_success "Frontend health check passed"
) else (
    call :print_error "Frontend health check failed"
)
goto :eof

:error_exit
call :print_error "Setup failed. Please check the logs and try again."
pause
exit /b 1