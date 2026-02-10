#!/bin/bash
# demo-toggle.sh — Switch between healthy and broken app for demo purposes
# Usage:
#   ./demo-toggle.sh break   → Deploy broken version (BUG_MODE=true)
#   ./demo-toggle.sh fix     → Deploy healthy version (BUG_MODE=false)
#   ./demo-toggle.sh status  → Check current state

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_YAML="k8s/backend.yaml"
BUG_MARKER="BUG_MODE"

current_state() {
    if grep -q '"true"' "$BACKEND_YAML" 2>/dev/null && grep -q "$BUG_MARKER" "$BACKEND_YAML"; then
        echo "broken"
    else
        echo "healthy"
    fi
}

case "${1:-status}" in
    break)
        STATE=$(current_state)
        if [ "$STATE" = "broken" ]; then
            echo -e "${YELLOW}⚠️  App is already in BROKEN state${NC}"
            exit 0
        fi

        echo -e "${RED}🐛 Injecting bug — enabling BUG_MODE...${NC}"

        # Add BUG_MODE=true to backend.yaml
        sed -i.bak 's/value: "false"/value: "true"/' "$BACKEND_YAML"
        rm -f "${BACKEND_YAML}.bak"

        git add -A
        git commit -m "🐛 Enable BUG_MODE: simulated DB connection pool exhaustion

This introduces intermittent 503 errors on write operations.
Backend will log 'DatabaseError: connection pool exhausted' errors.
70% of POST/PUT requests to /todos will fail."

        echo -e "${RED}🚀 Pushing broken version to trigger deploy...${NC}"
        git push origin main

        echo -e "${RED}💥 BROKEN version pushed! CI/CD will deploy automatically.${NC}"
        echo -e "   Monitor the pipeline: https://github.com/cnemri/devops-agent-demo-fullstack-app/actions"
        ;;

    fix)
        STATE=$(current_state)
        if [ "$STATE" = "healthy" ]; then
            echo -e "${YELLOW}⚠️  App is already in HEALTHY state${NC}"
            exit 0
        fi

        echo -e "${GREEN}🔧 Fixing — disabling BUG_MODE...${NC}"

        # Set BUG_MODE back to false
        sed -i.bak 's/value: "true"/value: "false"/' "$BACKEND_YAML"
        rm -f "${BACKEND_YAML}.bak"

        git add -A
        git commit -m "✅ Fix: Disable BUG_MODE — restore healthy state

BUG_MODE set back to false.
All write operations will succeed normally."

        echo -e "${GREEN}🚀 Pushing healthy version to trigger deploy...${NC}"
        git push origin main

        echo -e "${GREEN}✅ HEALTHY version pushed! CI/CD will deploy automatically.${NC}"
        echo -e "   Monitor the pipeline: https://github.com/cnemri/devops-agent-demo-fullstack-app/actions"
        ;;

    status)
        STATE=$(current_state)
        if [ "$STATE" = "broken" ]; then
            echo -e "${RED}💥 Current state: BROKEN (BUG_MODE=true)${NC}"
        else
            echo -e "${GREEN}✅ Current state: HEALTHY (BUG_MODE=false)${NC}"
        fi
        ;;

    *)
        echo "Usage: $0 {break|fix|status}"
        echo ""
        echo "  break   - Deploy the broken version (intermittent 503s)"
        echo "  fix     - Deploy the healthy version"
        echo "  status  - Show current state"
        exit 1
        ;;
esac
