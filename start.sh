#!/usr/bin/env bash
set -e

# HeartMuLa Studio — Start Script
# Starts both backend (FastAPI) and frontend (Next.js) servers

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDFILE_BACKEND="$SCRIPT_DIR/.backend.pid"
PIDFILE_FRONTEND="$SCRIPT_DIR/.frontend.pid"
BACKEND_PORT=8000
FRONTEND_PORT=3000
BACKEND_HOST="0.0.0.0"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}  ╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}  ║       HeartMuLa Studio v0.1.0       ║${NC}"
echo -e "${CYAN}${BOLD}  ║     AI Music Generation Studio      ║${NC}"
echo -e "${CYAN}${BOLD}  ╚══════════════════════════════════════╝${NC}"
echo ""

# Check for existing processes
if [ -f "$PIDFILE_BACKEND" ] && kill -0 "$(cat "$PIDFILE_BACKEND")" 2>/dev/null; then
    echo -e "${YELLOW}Backend is already running (PID $(cat "$PIDFILE_BACKEND"))${NC}"
    echo -e "Run ${BOLD}./stop.sh${NC} first to restart."
    exit 1
fi

if [ -f "$PIDFILE_FRONTEND" ] && kill -0 "$(cat "$PIDFILE_FRONTEND")" 2>/dev/null; then
    echo -e "${YELLOW}Frontend is already running (PID $(cat "$PIDFILE_FRONTEND"))${NC}"
    echo -e "Run ${BOLD}./stop.sh${NC} first to restart."
    exit 1
fi

# Check dependencies
echo -e "${BOLD}Checking dependencies...${NC}"

if ! command -v uv &>/dev/null; then
    echo -e "${RED}Error: uv is not installed. Install it: https://docs.astral.sh/uv/${NC}"
    exit 1
fi

if ! command -v pnpm &>/dev/null; then
    echo -e "${RED}Error: pnpm is not installed. Install it: npm install -g pnpm${NC}"
    exit 1
fi

echo -e "  ${GREEN}✓${NC} uv $(uv --version 2>/dev/null | head -1)"
echo -e "  ${GREEN}✓${NC} pnpm $(pnpm --version 2>/dev/null)"
echo ""

# Ensure dependencies are installed
echo -e "${BOLD}Installing dependencies (if needed)...${NC}"
(cd "$SCRIPT_DIR/backend" && uv sync --quiet 2>/dev/null) && echo -e "  ${GREEN}✓${NC} Backend dependencies"
(cd "$SCRIPT_DIR/frontend" && pnpm install --silent 2>/dev/null) && echo -e "  ${GREEN}✓${NC} Frontend dependencies"
echo ""

# Create data directories
mkdir -p "$SCRIPT_DIR/backend/data/outputs" "$SCRIPT_DIR/backend/data/uploads"

# Start backend
echo -e "${BOLD}Starting backend...${NC}"
cd "$SCRIPT_DIR/backend"
uv run uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" \
    > "$SCRIPT_DIR/.backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PIDFILE_BACKEND"

# Wait for backend to be ready
echo -n "  Waiting for backend"
for i in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        echo ""
        echo -e "  ${GREEN}✓${NC} Backend running (PID $BACKEND_PID)"
        break
    fi
    echo -n "."
    sleep 1
    if [ "$i" -eq 30 ]; then
        echo ""
        echo -e "  ${RED}✗ Backend failed to start. Check .backend.log${NC}"
        kill "$BACKEND_PID" 2>/dev/null
        rm -f "$PIDFILE_BACKEND"
        exit 1
    fi
done

# Start frontend
echo -e "${BOLD}Starting frontend...${NC}"
cd "$SCRIPT_DIR/frontend"
pnpm dev --port "$FRONTEND_PORT" > "$SCRIPT_DIR/.frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$PIDFILE_FRONTEND"

# Wait for frontend to be ready
echo -n "  Waiting for frontend"
for i in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:$FRONTEND_PORT" > /dev/null 2>&1; then
        echo ""
        echo -e "  ${GREEN}✓${NC} Frontend running (PID $FRONTEND_PID)"
        break
    fi
    echo -n "."
    sleep 1
    if [ "$i" -eq 30 ]; then
        echo ""
        echo -e "  ${YELLOW}! Frontend may still be compiling. Check .frontend.log${NC}"
        break
    fi
done

# Get local IP
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

# Print summary
echo ""
echo -e "${GREEN}${BOLD}  ┌──────────────────────────────────────┐${NC}"
echo -e "${GREEN}${BOLD}  │       Studio is ready!               │${NC}"
echo -e "${GREEN}${BOLD}  └──────────────────────────────────────┘${NC}"
echo ""
echo -e "  ${BOLD}Frontend:${NC}  http://localhost:${FRONTEND_PORT}"
echo -e "  ${BOLD}Backend:${NC}   http://localhost:${BACKEND_PORT}"
echo -e "  ${BOLD}API Docs:${NC}  http://localhost:${BACKEND_PORT}/docs"
if [ "$LOCAL_IP" != "127.0.0.1" ]; then
echo -e "  ${BOLD}Network:${NC}   http://${LOCAL_IP}:${FRONTEND_PORT}"
fi
echo ""
echo -e "  ${BOLD}Logs:${NC}      .backend.log / .frontend.log"
echo -e "  ${BOLD}Stop:${NC}      ./stop.sh"
echo ""
