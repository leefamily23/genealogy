#!/bin/bash

echo "Starting Local Test Server for Family Tree..."
echo "============================================="

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP server..."
    echo "Open http://localhost:8000/test-local.html in your browser"
    echo "Press Ctrl+C to stop the server"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python HTTP server..."
    echo "Open http://localhost:8000/test-local.html in your browser"
    echo "Press Ctrl+C to stop the server"
    python -m http.server 8000
elif command -v node &> /dev/null; then
    echo "Python not found, checking for Node.js..."
    if npm list -g http-server &> /dev/null; then
        echo "Using Node.js http-server..."
        echo "Open http://localhost:8000/test-local.html in your browser"
        http-server -p 8000
    else
        echo "Installing http-server..."
        npm install -g http-server
        echo "Open http://localhost:8000/test-local.html in your browser"
        http-server -p 8000
    fi
else
    echo "Neither Python nor Node.js found!"
    echo "Please install Python or Node.js to run the local server."
    echo ""
    echo "Alternative: Open test-local.html directly in your browser"
    echo "(Note: Some features may not work due to CORS restrictions)"
fi