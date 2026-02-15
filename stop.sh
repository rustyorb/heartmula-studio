#!/usr/bin/env bash

# HeartMuLa Studio — Stop Script
# Gracefully shuts down both backend and frontend servers

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDFILE_BACKEND="$SCRIPT_DIR/.backend.pid"
PIDFILE_FRONTEND="$SCRIPT_DIR/.frontend.pid"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}  HeartMuLa Studio — Shutting down${NC}"
echo ""

STOPPED=0

# Stop frontend
if [ -f "$PIDFILE_FRONTEND" ]; then
    PID=$(cat "$PIDFILE_FRONTEND")
    if kill -0 "$PID" 2>/dev/null; then
        echo -n "  Stopping frontend (PID $PID)..."
        # Kill the process group to catch child processes (next dev spawns children)
        kill -- -"$PID" 2>/dev/null || kill "$PID" 2>/dev/null
        # Wait for process to exit
        for i in $(seq 1 10); do
            if ! kill -0 "$PID" 2>/dev/null; then
                break
            fi
            sleep 0.5
        done
        # Force kill if still alive
        if kill -0 "$PID" 2>/dev/null; then
            kill -9 "$PID" 2>/dev/null
        fi
        echo -e " ${GREEN}stopped${NC}"
        STOPPED=$((STOPPED + 1))
    else
        echo -e "  ${YELLOW}Frontend (PID $PID) was not running${NC}"
    fi
    rm -f "$PIDFILE_FRONTEND"
else
    echo -e "  ${YELLOW}No frontend PID file found${NC}"
fi

# Stop backend
if [ -f "$PIDFILE_BACKEND" ]; then
    PID=$(cat "$PIDFILE_BACKEND")
    if kill -0 "$PID" 2>/dev/null; then
        echo -n "  Stopping backend (PID $PID)..."
        kill "$PID" 2>/dev/null
        for i in $(seq 1 10); do
            if ! kill -0 "$PID" 2>/dev/null; then
                break
            fi
            sleep 0.5
        done
        if kill -0 "$PID" 2>/dev/null; then
            kill -9 "$PID" 2>/dev/null
        fi
        echo -e " ${GREEN}stopped${NC}"
        STOPPED=$((STOPPED + 1))
    else
        echo -e "  ${YELLOW}Backend (PID $PID) was not running${NC}"
    fi
    rm -f "$PIDFILE_BACKEND"
else
    echo -e "  ${YELLOW}No backend PID file found${NC}"
fi

# Also kill any orphaned uvicorn/next processes on our ports
for PORT in 8000 3000; do
    ORPHAN_PIDS=$(lsof -ti ":$PORT" 2>/dev/null || true)
    if [ -n "$ORPHAN_PIDS" ]; then
        echo -e "  ${YELLOW}Killing orphaned process(es) on port $PORT${NC}"
        echo "$ORPHAN_PIDS" | xargs kill 2>/dev/null || true
        STOPPED=$((STOPPED + 1))
    fi
done

echo ""
if [ "$STOPPED" -gt 0 ]; then
    echo -e "  ${GREEN}${BOLD}All services stopped.${NC}"
else
    echo -e "  ${YELLOW}Nothing was running.${NC}"
fi
echo ""
