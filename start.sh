#!/usr/bin/env bash
# NeuroTwin — One-command startup
# Starts Qdrant, FastAPI backend, and web dashboard.
#
# Usage:
#   ./start.sh              # Start all services
#   ./start.sh --stop       # Stop all services
#   ./start.sh --status     # Check running status
#   ./start.sh --docker     # Use Docker Compose instead

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
WEB_DIR="$ROOT_DIR/web"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$LOG_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
    echo -e "${CYAN}"
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║        NeuroTwin — Cognitive Companion    ║"
    echo "  ║        AI Memory Support System           ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_port() {
    lsof -ti :"$1" >/dev/null 2>&1
}

kill_port() {
    lsof -ti :"$1" 2>/dev/null | xargs kill -9 2>/dev/null || true
}

status() {
    echo -e "\n${CYAN}Service Status:${NC}"
    for svc_port in 6333 8000 5500; do
        local name=""
        case $svc_port in
            6333) name="Qdrant Vector DB" ;;
            8000) name="FastAPI Backend " ;;
            5500) name="Web Dashboard   " ;;
        esac
        if check_port $svc_port; then
            echo -e "  ${GREEN}●${NC} $name (port $svc_port) — ${GREEN}RUNNING${NC}"
        else
            echo -e "  ${RED}●${NC} $name (port $svc_port) — ${RED}STOPPED${NC}"
        fi
    done
    echo ""
}

stop_all() {
    echo -e "${YELLOW}Stopping all NeuroTwin services...${NC}"
    kill_port 6333
    kill_port 8000
    kill_port 5500
    # Kill by process name pattern
    pkill -f "qdrant.*config-path" 2>/dev/null || true
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "http.server 5500" 2>/dev/null || true
    echo -e "${GREEN}All services stopped.${NC}"
    status
}

start_qdrant() {
    if check_port 6333; then
        echo -e "  ${GREEN}●${NC} Qdrant already running (port 6333)"
        return
    fi
    echo -e "  ${YELLOW}▶${NC} Starting Qdrant..."
    cd "$BACKEND_DIR"
    ./qdrant/bin/qdrant --config-path qdrant/config.yaml > "$LOG_DIR/qdrant.log" 2>&1 &
    local pid=$!
    # Wait for Qdrant to be ready
    for i in $(seq 1 15); do
        if curl -sf http://localhost:6333/readyz >/dev/null 2>&1; then
            echo -e "  ${GREEN}●${NC} Qdrant started (port 6333, PID $pid)"
            return
        fi
        sleep 1
    done
    echo -e "  ${RED}●${NC} Qdrant failed to start — check $LOG_DIR/qdrant.log"
}

start_backend() {
    if check_port 8000; then
        echo -e "  ${GREEN}●${NC} FastAPI already running (port 8000)"
        return
    fi
    echo -e "  ${YELLOW}▶${NC} Starting FastAPI backend..."
    cd "$BACKEND_DIR"
    .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
    local pid=$!
    for i in $(seq 1 10); do
        if curl -sf http://localhost:8000/api/v1/health >/dev/null 2>&1; then
            echo -e "  ${GREEN}●${NC} FastAPI started (port 8000, PID $pid)"
            return
        fi
        sleep 1
    done
    echo -e "  ${RED}●${NC} FastAPI failed to start — check $LOG_DIR/backend.log"
}

start_web() {
    if check_port 5500; then
        echo -e "  ${GREEN}●${NC} Web dashboard already running (port 5500)"
        return
    fi
    echo -e "  ${YELLOW}▶${NC} Starting web dashboard..."
    cd "$WEB_DIR"
    python3 -m http.server 5500 > "$LOG_DIR/web.log" 2>&1 &
    local pid=$!
    sleep 1
    if check_port 5500; then
        echo -e "  ${GREEN}●${NC} Web dashboard started (port 5500, PID $pid)"
    else
        echo -e "  ${RED}●${NC} Web dashboard failed — check $LOG_DIR/web.log"
    fi
}

start_all() {
    print_banner

    echo -e "${CYAN}Starting services...${NC}\n"
    start_qdrant
    start_backend
    start_web

    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  All services running!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${CYAN}Web UI:${NC}      http://localhost:5500"
    echo -e "  ${CYAN}API Docs:${NC}    http://localhost:8000/docs"
    echo -e "  ${CYAN}Backend:${NC}     http://localhost:8000/api/v1/health"
    echo -e "  ${CYAN}Logs:${NC}        $LOG_DIR/"
    echo ""
    echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""

    # Trap to cleanup on exit
    trap stop_all EXIT INT TERM

    # Wait forever
    wait
}

# Main
case "${1:-}" in
    --stop|-s)
        stop_all
        ;;
    --status|-t)
        status
        ;;
    --docker|-d)
        echo -e "${CYAN}Starting with Docker Compose...${NC}"
        cd "$ROOT_DIR"
        docker compose up --build
        ;;
    --help|-h)
        echo "Usage: ./start.sh [option]"
        echo ""
        echo "Options:"
        echo "  (none)      Start all services (Qdrant + FastAPI + Web)"
        echo "  --stop      Stop all services"
        echo "  --status    Check running status"
        echo "  --docker    Use Docker Compose instead"
        echo "  --help      Show this help"
        ;;
    *)
        start_all
        ;;
esac
