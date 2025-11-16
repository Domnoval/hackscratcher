#!/bin/bash
# Automated test runner for Scratch Oracle web app
# Uses webapp-testing skill with Playwright

echo "======================================================================"
echo "SCRATCH ORACLE WEB APP AUTOMATED TESTING"
echo "======================================================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:8081 > /dev/null; then
    echo "⚠️  Server not running at http://localhost:8081"
    echo "Starting web server..."
    echo ""

    cd "$(dirname "$0")/../.."
    npm run web &
    SERVER_PID=$!

    echo "Waiting for server to start..."
    sleep 10

    # Run tests
    python tests/e2e/webapp-test.py
    TEST_EXIT_CODE=$?

    # Stop server
    echo ""
    echo "Stopping server (PID: $SERVER_PID)..."
    kill $SERVER_PID

    exit $TEST_EXIT_CODE
else
    echo "✅ Server already running at http://localhost:8081"
    echo ""

    # Run tests directly
    python tests/e2e/webapp-test.py
    exit $?
fi
