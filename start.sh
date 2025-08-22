#!/bin/bash

# PromptPilot Startup Script
# This script starts both backend and frontend services
# Supports development and production modes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
METRICS_PORT=8001
LOG_DIR="./logs"

# Default mode
MODE="development"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[PromptPilot]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti :$port)
    if [ ! -z "$pids" ]; then
        print_warning "Killing existing processes on port $port"
        echo $pids | xargs kill -9
        sleep 2
    fi
}

# Function to create log directory
setup_logging() {
    mkdir -p $LOG_DIR
    print_status "Log directory created: $LOG_DIR"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Function to setup Python virtual environment
setup_python_env() {
    print_status "Setting up Python environment..."
    
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate || source venv/Scripts/activate
    
    # Install/update dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    print_success "Python environment ready"
}

# Function to setup Node.js environment
setup_node_env() {
    print_status "Setting up Node.js environment..."
    
    cd ui/dashboard
    
    # Install dependencies if node_modules doesn't exist or package.json is newer
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    fi
    
    cd ../..
    print_success "Node.js environment ready"
}

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    
    # Activate virtual environment
    source venv/bin/activate || source venv/Scripts/activate
    
    # Check if port is in use
    if check_port $BACKEND_PORT; then
        print_warning "Backend port $BACKEND_PORT is already in use"
        kill_port $BACKEND_PORT
    fi
    
    # Start backend based on mode
    if [ "$MODE" = "production" ]; then
        print_status "Starting backend in production mode..."
        nohup gunicorn api.rest:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$BACKEND_PORT --access-logfile $LOG_DIR/access.log --error-logfile $LOG_DIR/error.log > $LOG_DIR/backend.log 2>&1 &
    else
        print_status "Starting backend in development mode..."
        nohup uvicorn api.rest:app --host 0.0.0.0 --port $BACKEND_PORT --reload > $LOG_DIR/backend.log 2>&1 &
    fi
    
    BACKEND_PID=$!
    echo $BACKEND_PID > $LOG_DIR/backend.pid
    
    # Wait for backend to start
    print_status "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
            print_success "Backend started successfully on port $BACKEND_PORT"
            return 0
        fi
        sleep 1
    done
    
    print_error "Backend failed to start"
    return 1
}

# Function to start metrics server
start_metrics() {
    print_status "Starting metrics server..."
    
    # Check if port is in use
    if check_port $METRICS_PORT; then
        print_warning "Metrics port $METRICS_PORT is already in use"
        kill_port $METRICS_PORT
    fi
    
    # Activate virtual environment
    source venv/bin/activate || source venv/Scripts/activate
    
    # Start metrics server
    nohup python -c "
from prometheus_client import start_http_server
import time
print('Starting metrics server on port $METRICS_PORT')
start_http_server($METRICS_PORT)
while True:
    time.sleep(1)
" > $LOG_DIR/metrics.log 2>&1 &
    
    METRICS_PID=$!
    echo $METRICS_PID > $LOG_DIR/metrics.pid
    
    # Wait for metrics server to start
    sleep 2
    if check_port $METRICS_PORT; then
        print_success "Metrics server started on port $METRICS_PORT"
    else
        print_warning "Metrics server may not have started properly"
    fi
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend server..."
    
    cd ui/dashboard
    
    # Check if port is in use
    if check_port $FRONTEND_PORT; then
        print_warning "Frontend port $FRONTEND_PORT is already in use"
        kill_port $FRONTEND_PORT
    fi
    
    # Start frontend based on mode
    if [ "$MODE" = "production" ]; then
        print_status "Starting frontend in production mode..."
        # Build first
        npm run build
        # Serve with a simple HTTP server
        nohup npx serve -s build -l $FRONTEND_PORT > ../../$LOG_DIR/frontend.log 2>&1 &
    else
        print_status "Starting frontend in development mode..."
        nohup npm start > ../../$LOG_DIR/frontend.log 2>&1 &
    fi
    
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../../$LOG_DIR/frontend.pid
    
    cd ../..
    
    # Wait for frontend to start
    print_status "Waiting for frontend to start..."
    for i in {1..60}; do
        if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
            print_success "Frontend started successfully on port $FRONTEND_PORT"
            return 0
        fi
        sleep 1
    done
    
    print_error "Frontend failed to start"
    return 1
}

# Function to show status
show_status() {
    print_status "PromptPilot Status:"
    echo ""
    
    if check_port $BACKEND_PORT; then
        print_success "✓ Backend running on http://localhost:$BACKEND_PORT"
        echo "  - API Documentation: http://localhost:$BACKEND_PORT/docs"
        echo "  - Health Check: http://localhost:$BACKEND_PORT/health"
    else
        print_error "✗ Backend not running"
    fi
    
    if check_port $METRICS_PORT; then
        print_success "✓ Metrics server running on http://localhost:$METRICS_PORT"
    else
        print_warning "⚠ Metrics server not running"
    fi
    
    if check_port $FRONTEND_PORT; then
        print_success "✓ Frontend running on http://localhost:$FRONTEND_PORT"
    else
        print_error "✗ Frontend not running"
    fi
    
    echo ""
    print_status "Logs available in: $LOG_DIR/"
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    
    # Stop backend
    if [ -f "$LOG_DIR/backend.pid" ]; then
        kill -9 $(cat $LOG_DIR/backend.pid) 2>/dev/null || true
        rm -f $LOG_DIR/backend.pid
    fi
    kill_port $BACKEND_PORT
    
    # Stop metrics
    if [ -f "$LOG_DIR/metrics.pid" ]; then
        kill -9 $(cat $LOG_DIR/metrics.pid) 2>/dev/null || true
        rm -f $LOG_DIR/metrics.pid
    fi
    kill_port $METRICS_PORT
    
    # Stop frontend
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        kill -9 $(cat $LOG_DIR/frontend.pid) 2>/dev/null || true
        rm -f $LOG_DIR/frontend.pid
    fi
    kill_port $FRONTEND_PORT
    
    print_success "All services stopped"
}

# Function to show logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        echo "Available logs:"
        ls -la $LOG_DIR/
        return
    fi
    
    local log_file="$LOG_DIR/${service}.log"
    if [ -f "$log_file" ]; then
        tail -f "$log_file"
    else
        print_error "Log file not found: $log_file"
    fi
}

# Function to install production dependencies
install_production() {
    print_status "Installing production dependencies..."
    
    # Install serve for frontend production serving
    cd ui/dashboard
    npm install -g serve
    cd ../..
    
    print_success "Production dependencies installed"
}

# Function to run health checks
health_check() {
    print_status "Running health checks..."
    
    # Backend health check
    if curl -s http://localhost:$BACKEND_PORT/health | grep -q "healthy"; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
    fi
    
    # Frontend health check
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
    fi
}

# Function to show help
show_help() {
    echo "PromptPilot Startup Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start         Start all services (default)"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  status        Show service status"
    echo "  logs [service] Show logs (backend, frontend, metrics)"
    echo "  health        Run health checks"
    echo "  install       Install dependencies"
    echo "  help          Show this help message"
    echo ""
    echo "Options:"
    echo "  --production  Run in production mode"
    echo "  --dev         Run in development mode (default)"
    echo ""
    echo "Examples:"
    echo "  $0 start --production    # Start in production mode"
    echo "  $0 logs backend          # Show backend logs"
    echo "  $0 restart --dev         # Restart in development mode"
}

# Parse command line arguments
COMMAND="start"
while [[ $# -gt 0 ]]; do
    case $1 in
        start|stop|restart|status|logs|health|install|help)
            COMMAND=$1
            shift
            ;;
        --production)
            MODE="production"
            shift
            ;;
        --dev)
            MODE="development"
            shift
            ;;
        *)
            # For logs command, capture the service name
            if [ "$COMMAND" = "logs" ]; then
                SERVICE=$1
            fi
            shift
            ;;
    esac
done

# Main execution
case $COMMAND in
    start)
        print_status "Starting PromptPilot in $MODE mode..."
        check_dependencies
        setup_logging
        
        if [ "$MODE" = "production" ]; then
            install_production
        fi
        
        setup_python_env
        setup_node_env
        
        start_backend
        start_metrics
        start_frontend
        
        echo ""
        show_status
        echo ""
        print_success "PromptPilot started successfully!"
        print_status "Press Ctrl+C to stop all services"
        
        # Keep script running and handle Ctrl+C
        trap stop_services INT
        wait
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        $0 start --$MODE
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs $SERVICE
        ;;
    health)
        health_check
        ;;
    install)
        check_dependencies
        setup_python_env
        setup_node_env
        if [ "$MODE" = "production" ]; then
            install_production
        fi
        print_success "Dependencies installed successfully"
        ;;
    help)
        show_help
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac