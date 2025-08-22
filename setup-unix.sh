#!/bin/bash

# PromptPilot Linux/macOS Setup Script
# Supports Ubuntu/Debian, CentOS/RHEL, and macOS
# Run with: curl -fsSL https://raw.githubusercontent.com/your-repo/PromptPilot/main/setup-unix.sh | bash

set -e  # Exit on any error

# Configuration
INSTALL_PATH="$HOME/PromptPilot"
DATABASE_PASSWORD="promptpilot_secure_password"
DEVELOPMENT=false
SKIP_DEPENDENCY_CHECK=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macos"
    elif [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS="linux"
        DISTRO=$ID
    else
        log_error "Unsupported operating system"
        exit 1
    fi
    
    log_info "Detected OS: $OS ($DISTRO)"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if user has sudo privileges
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_warning "This script requires sudo privileges for system package installation"
        log_info "You may be prompted for your password"
    fi
}

# Install system dependencies
install_system_dependencies() {
    log_info "Installing system dependencies..."
    
    case $DISTRO in
        ubuntu|debian)
            sudo apt update
            sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
            ;;
        centos|rhel|fedora)
            if command_exists dnf; then
                sudo dnf install -y curl wget git gcc gcc-c++ make
            else
                sudo yum install -y curl wget git gcc gcc-c++ make
            fi
            ;;
        macos)
            # Check if Homebrew is installed
            if ! command_exists brew; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update
            ;;
        *)
            log_warning "Unknown distribution. Skipping system dependency installation."
            ;;
    esac
}

# Install Node.js
install_nodejs() {
    if command_exists node; then
        NODE_VERSION=$(node --version)
        log_success "Node.js already installed: $NODE_VERSION"
        return
    fi
    
    log_info "Installing Node.js 18..."
    
    case $DISTRO in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            if command_exists dnf; then
                sudo dnf install -y nodejs npm
            else
                sudo yum install -y nodejs npm
            fi
            ;;
        macos)
            brew install node@18
            brew link node@18
            ;;
    esac
    
    log_success "Node.js installed: $(node --version)"
}

# Install Python
install_python() {
    if command_exists python3 && python3 -c "import sys; exit(0 if sys.version_info >= (3, 11) else 1)" 2>/dev/null; then
        PYTHON_VERSION=$(python3 --version)
        log_success "Python already installed: $PYTHON_VERSION"
        return
    fi
    
    log_info "Installing Python 3.11..."
    
    case $DISTRO in
        ubuntu|debian)
            sudo add-apt-repository -y ppa:deadsnakes/ppa
            sudo apt update
            sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
            # Create symlink if needed
            if ! command_exists python3; then
                sudo ln -sf /usr/bin/python3.11 /usr/bin/python3
            fi
            ;;
        centos|rhel|fedora)
            if command_exists dnf; then
                sudo dnf install -y python3.11 python3.11-pip python3.11-devel
            else
                sudo yum install -y python39 python39-pip python39-devel
            fi
            ;;
        macos)
            brew install python@3.11
            brew link python@3.11
            ;;
    esac
    
    log_success "Python installed: $(python3 --version)"
}

# Install PostgreSQL
install_postgresql() {
    if command_exists psql; then
        log_success "PostgreSQL already installed"
        return
    fi
    
    log_info "Installing PostgreSQL 15..."
    
    case $DISTRO in
        ubuntu|debian)
            wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
            echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
            sudo apt update
            sudo apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15
            ;;
        centos|rhel|fedora)
            if command_exists dnf; then
                sudo dnf install -y postgresql15-server postgresql15-contrib
            else
                sudo yum install -y postgresql15-server postgresql15-contrib
            fi
            sudo postgresql-setup --initdb
            sudo systemctl enable postgresql
            ;;
        macos)
            brew install postgresql@15
            brew services start postgresql@15
            ;;
    esac
    
    log_success "PostgreSQL installed"
}

# Install Redis
install_redis() {
    if command_exists redis-server || command_exists redis-cli; then
        log_success "Redis already installed"
        return
    fi
    
    log_info "Installing Redis..."
    
    case $DISTRO in
        ubuntu|debian)
            sudo apt install -y redis-server
            ;;
        centos|rhel|fedora)
            if command_exists dnf; then
                sudo dnf install -y redis
            else
                sudo yum install -y redis
            fi
            ;;
        macos)
            brew install redis
            ;;
    esac
    
    log_success "Redis installed"
}

# Setup PostgreSQL database
setup_database() {
    log_info "Setting up PostgreSQL database..."
    
    # Start PostgreSQL service
    case $DISTRO in
        ubuntu|debian)
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
        centos|rhel|fedora)
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
        macos)
            brew services start postgresql@15
            ;;
    esac
    
    # Wait for PostgreSQL to start
    sleep 5
    
    # Setup database and user
    sudo -u postgres psql << EOF
CREATE DATABASE promptpilot;
CREATE USER promptpilot_user WITH PASSWORD '$DATABASE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE promptpilot TO promptpilot_user;
\q
EOF
    
    log_success "Database setup completed"
}

# Start Redis service
start_redis() {
    log_info "Starting Redis service..."
    
    case $DISTRO in
        ubuntu|debian|centos|rhel|fedora)
            sudo systemctl start redis
            sudo systemctl enable redis
            ;;
        macos)
            brew services start redis
            ;;
    esac
    
    log_success "Redis service started"
}

# Clone repository
clone_repository() {
    if [[ -d "$INSTALL_PATH" ]]; then
        log_info "Installation directory exists. Updating..."
        cd "$INSTALL_PATH"
        git pull origin main
    else
        log_info "Cloning PromptPilot repository..."
        git clone https://github.com/your-repo/PromptPilot.git "$INSTALL_PATH"
        cd "$INSTALL_PATH"
    fi
}

# Setup environment
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Generate random secrets
    SECRET_KEY=$(openssl rand -hex 32)
    JWT_SECRET_KEY=$(openssl rand -hex 32)
    
    # Create .env file
    cat > .env << EOF
# Application Settings
APP_NAME=PromptPilot
APP_VERSION=1.0.0
DEBUG=$DEVELOPMENT
SECRET_KEY=$SECRET_KEY
CORS_ORIGINS=["http://localhost:3000"]

# Database Configuration
DATABASE_URL=postgresql://promptpilot_user:$DATABASE_PASSWORD@localhost:5432/promptpilot
REDIS_URL=redis://localhost:6379/0

# Security Settings
JWT_SECRET_KEY=$JWT_SECRET_KEY
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=8001
LOG_LEVEL=INFO

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
EOF
    
    log_success "Environment file created"
}

# Setup Python environment
setup_python() {
    log_info "Setting up Python environment..."
    
    # Create virtual environment
    python3 -m venv venv
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    python -m pip install --upgrade pip
    
    # Install requirements
    pip install -r requirements.txt
    
    log_success "Python environment setup completed"
}

# Setup database schema
setup_database_schema() {
    log_info "Setting up database schema..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Run database migrations
    python -m alembic upgrade head
    
    log_success "Database schema setup completed"
}

# Setup frontend
setup_frontend() {
    log_info "Setting up frontend..."
    
    cd ui/dashboard
    
    # Install npm dependencies
    npm install
    
    # Build frontend (skip in development mode)
    if [[ "$DEVELOPMENT" != "true" ]]; then
        npm run build
    else
        log_info "Development mode - skipping build"
    fi
    
    cd ../..
    log_success "Frontend setup completed"
}

# Create startup scripts
create_startup_scripts() {
    log_info "Creating startup scripts..."
    
    # Create backend startup script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "Starting PromptPilot Backend..."
cd "$(dirname "$0")"
source venv/bin/activate
python -m uvicorn api.rest:app --host 0.0.0.0 --port 8000 --reload
EOF
    chmod +x start-backend.sh
    
    # Create frontend startup script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "Starting PromptPilot Frontend..."
cd "$(dirname "$0")/ui/dashboard"
npm start
EOF
    chmod +x start-frontend.sh
    
    # Create combined startup script
    cat > start-promptpilot.sh << 'EOF'
#!/bin/bash
echo "Starting PromptPilot (Full Stack)..."
cd "$(dirname "$0")"

echo "Starting Backend..."
gnome-terminal --title="PromptPilot Backend" -- bash -c "./start-backend.sh; exec bash" 2>/dev/null || \
xterm -title "PromptPilot Backend" -e "./start-backend.sh" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "./start-backend.sh"' 2>/dev/null || \
./start-backend.sh &

echo "Waiting for backend to start..."
sleep 10

echo "Starting Frontend..." 
gnome-terminal --title="PromptPilot Frontend" -- bash -c "./start-frontend.sh; exec bash" 2>/dev/null || \
xterm -title "PromptPilot Frontend" -e "./start-frontend.sh" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "./start-frontend.sh"' 2>/dev/null || \
./start-frontend.sh &

echo "PromptPilot is starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
EOF
    chmod +x start-promptpilot.sh
    
    log_success "Startup scripts created"
}

# Test installation
test_installation() {
    log_info "Testing installation..."
    
    # Test backend
    source venv/bin/activate
    if python -c "import fastapi, sqlalchemy, redis; print('Backend dependencies OK')" 2>/dev/null; then
        log_success "Backend test: PASSED"
    else
        log_error "Backend test: FAILED"
    fi
    
    # Test frontend
    cd ui/dashboard
    if npm run type-check >/dev/null 2>&1; then
        log_success "Frontend test: PASSED"
    else
        log_error "Frontend test: FAILED"
    fi
    cd ../..
}

# Show summary
show_summary() {
    echo
    log_info "========================="
    log_success "PromptPilot Setup Complete!"
    log_info "========================="
    echo
    log_info "Installation Path: $INSTALL_PATH"
    log_info "Database: PostgreSQL (localhost:5432)"
    log_info "Cache: Redis (localhost:6379)"
    echo
    log_info "To start PromptPilot:"
    log_success "  ./start-promptpilot.sh"
    echo
    log_info "Or start services individually:"
    log_info "  ./start-backend.sh    (API server)"
    log_info "  ./start-frontend.sh   (Web interface)"
    echo
    log_info "URLs:"
    log_success "  Frontend: http://localhost:3000"
    log_success "  Backend API: http://localhost:8000"
    log_success "  API Documentation: http://localhost:8000/docs"
    log_success "  Metrics: http://localhost:8001/metrics"
    echo
    log_info "Configuration:"
    log_info "  Environment file: .env"
    log_info "  Logs: logs/ directory"
    log_info "  Uploads: uploads/ directory"
    echo
    log_info "Support:"
    log_info "  Documentation: PRODUCTION_SETUP_GUIDE.md"
    log_info "  Issues: https://github.com/your-repo/PromptPilot/issues"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --development)
            DEVELOPMENT=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPENDENCY_CHECK=true
            shift
            ;;
        --install-path)
            INSTALL_PATH="$2"
            shift 2
            ;;
        --db-password)
            DATABASE_PASSWORD="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --development       Setup for development (skip build)"
            echo "  --skip-deps         Skip system dependency installation"
            echo "  --install-path DIR  Installation directory (default: ~/PromptPilot)"
            echo "  --db-password PASS  Database password"
            echo "  --help              Show this help"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "PromptPilot Unix Setup Starting..."
    log_info "=================================="

    detect_os
    
    if [[ "$SKIP_DEPENDENCY_CHECK" != "true" ]]; then
        check_sudo
        install_system_dependencies
        install_nodejs
        install_python
        install_postgresql
        install_redis
        setup_database
        start_redis
    fi

    clone_repository
    setup_environment
    setup_python
    setup_database_schema
    setup_frontend
    create_startup_scripts
    test_installation
    show_summary

    log_success "Setup completed successfully!"
    
    # Optional: Start services immediately
    echo
    read -p "Start PromptPilot now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Starting PromptPilot..."
        ./start-promptpilot.sh
    fi
}

# Error handling
trap 'log_error "Setup failed. Check the error messages above."; exit 1' ERR

# Run main function
main "$@"