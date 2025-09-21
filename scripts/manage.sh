#!/bin/bash

# Arkham Liquidation Monitor - Management Script
# Usage: ./scripts/manage.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 is not installed. Installing PM2..."
        npm install -g pm2
    fi
}

# Function to check if dotenv is installed
check_dotenv() {
    if [ ! -d "node_modules/dotenv" ]; then
        print_warning "dotenv package not found. Installing..."
        npm install dotenv
    fi
}

# Function to check environment file
check_env() {
    if [ ! -f ".env.local" ]; then
        print_error ".env.local file not found!"
        print_info "Creating .env.local from example..."
        if [ -f ".env.local.example" ]; then
            cp .env.local.example .env.local
            print_warning "Please update .env.local with your actual credentials"
            exit 1
        else
            print_error "No .env.local.example file found!"
            exit 1
        fi
    fi
}

# Function to create logs directory
setup_logs() {
    if [ ! -d "logs" ]; then
        print_info "Creating logs directory..."
        mkdir -p logs
    fi
}

# Main command handler
case "$1" in
    start)
        print_info "Starting all Arkham services..."
        check_pm2
        check_dotenv
        check_env
        setup_logs

        pm2 start ecosystem.config.js
        print_success "All services started successfully!"
        pm2 status
        ;;

    start-main)
        print_info "Starting main services (tiered-sync and entity-sync)..."
        check_pm2
        check_dotenv
        check_env
        setup_logs

        pm2 start ecosystem.config.js --only "arkham-tiered-sync,arkham-entity-sync"
        print_success "Main services started!"
        pm2 status
        ;;

    stop)
        print_info "Stopping all Arkham services..."
        pm2 stop ecosystem.config.js
        print_success "All services stopped"
        ;;

    restart)
        print_info "Restarting all Arkham services..."
        pm2 restart ecosystem.config.js
        print_success "All services restarted"
        pm2 status
        ;;

    reload)
        print_info "Gracefully reloading all services..."
        pm2 reload ecosystem.config.js
        print_success "All services reloaded"
        ;;

    status)
        pm2 status
        echo ""
        print_info "Service Details:"
        pm2 describe arkham-tiered-sync | grep -E "(status|uptime|restarts|cpu|memory)"
        ;;

    logs)
        print_info "Showing logs (press Ctrl+C to exit)..."
        pm2 logs ${2:-"--lines=50"}
        ;;

    logs-error)
        print_info "Showing error logs..."
        tail -n 50 logs/*error*.log 2>/dev/null || print_warning "No error logs found"
        ;;

    monitor)
        print_info "Opening PM2 monitor..."
        pm2 monit
        ;;

    save)
        print_info "Saving PM2 process list..."
        pm2 save
        print_success "PM2 process list saved"
        ;;

    startup)
        print_info "Setting up PM2 startup script..."
        pm2 startup
        print_warning "Run the command above with sudo to enable auto-start on boot"
        ;;

    reset)
        print_warning "Resetting PM2 metrics..."
        pm2 reset all
        print_success "Metrics reset"
        ;;

    delete)
        print_warning "Removing all Arkham services from PM2..."
        pm2 delete ecosystem.config.js
        print_success "All services removed"
        ;;

    update)
        print_info "Updating services configuration..."
        pm2 stop ecosystem.config.js
        pm2 delete ecosystem.config.js
        pm2 start ecosystem.config.js
        print_success "Services updated with new configuration"
        pm2 status
        ;;

    health)
        print_info "Checking system health..."
        echo ""

        # Check if services are running
        if pm2 list | grep -q "arkham-tiered-sync.*online"; then
            print_success "Tiered Sync: RUNNING"
        else
            print_error "Tiered Sync: STOPPED"
        fi

        if pm2 list | grep -q "arkham-entity-sync.*online"; then
            print_success "Entity Sync: RUNNING"
        else
            print_warning "Entity Sync: STOPPED"
        fi

        # Check Hyperliquid APIs (dual endpoint setup)
        # Check Private API (local node for account states) - requires POST request
        if curl -s -X POST -H "Content-Type: application/json" \
           -d '{"type":"clearinghouseState","user":"0x0000000000000000000000000000000000000000"}' \
           ${HYPERLIQUID_PRIVATE_API_URL:-http://localhost:3001/info} \
           -o /dev/null -w "%{http_code}" | grep -q "200"; then
            print_success "Hyperliquid Private API (account states): ACCESSIBLE"
        else
            print_error "Hyperliquid Private API (account states): NOT ACCESSIBLE"
        fi

        # Check Public API (for price data)
        if curl -s -X POST -H "Content-Type: application/json" -d '{"type":"allMids"}' \
           ${HYPERLIQUID_PUBLIC_API_URL:-https://api.hyperliquid.xyz/info} -o /dev/null -w "%{http_code}" | grep -q "200"; then
            print_success "Hyperliquid Public API (price data): ACCESSIBLE"
        else
            print_error "Hyperliquid Public API (price data): NOT ACCESSIBLE"
        fi

        # Check log sizes
        echo ""
        print_info "Log file sizes:"
        du -sh logs/*.log 2>/dev/null | head -5 || print_info "No log files yet"
        ;;

    clean-logs)
        print_warning "Cleaning old log files..."
        find logs -name "*.log" -type f -mtime +7 -delete
        print_success "Old logs cleaned (kept last 7 days)"
        ;;

    install)
        print_info "Installing and setting up everything..."
        npm install
        check_dotenv
        check_env
        setup_logs
        check_pm2
        pm2 start ecosystem.config.js
        pm2 save
        print_success "Installation complete!"
        print_info "Run './scripts/manage.sh startup' to enable auto-start on boot"
        ;;

    *)
        echo "Arkham Liquidation Monitor - Management Script"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Service Management:"
        echo "  start         - Start all services"
        echo "  start-main    - Start only main services (tiered and entity sync)"
        echo "  stop          - Stop all services"
        echo "  restart       - Restart all services"
        echo "  reload        - Gracefully reload all services"
        echo "  delete        - Remove all services from PM2"
        echo "  update        - Update services with new configuration"
        echo ""
        echo "Monitoring:"
        echo "  status        - Show service status"
        echo "  logs [n]      - Show last n lines of logs (default: 50)"
        echo "  logs-error    - Show error logs"
        echo "  monitor       - Open PM2 monitor"
        echo "  health        - Check system health"
        echo ""
        echo "Maintenance:"
        echo "  save          - Save PM2 process list"
        echo "  startup       - Setup auto-start on boot"
        echo "  reset         - Reset PM2 metrics"
        echo "  clean-logs    - Remove old log files"
        echo ""
        echo "Setup:"
        echo "  install       - Full installation and setup"
        echo ""
        exit 1
        ;;
esac