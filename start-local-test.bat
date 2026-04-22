@echo off
echo Starting Local Test Server for Family Tree...
echo =============================================

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python HTTP server...
    echo Open http://localhost:8000/test-local.html in your browser
    echo Press Ctrl+C to stop the server
    python -m http.server 8000
) else (
    REM Check if Node.js is available
    node --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Python not found, checking for Node.js...
        npm list -g http-server >nul 2>&1
        if %errorlevel% == 0 (
            echo Using Node.js http-server...
            echo Open http://localhost:8000/test-local.html in your browser
            http-server -p 8000
        ) else (
            echo Installing http-server...
            npm install -g http-server
            echo Open http://localhost:8000/test-local.html in your browser
            http-server -p 8000
        )
    ) else (
        echo Neither Python nor Node.js found!
        echo Please install Python or Node.js to run the local server.
        echo.
        echo Alternative: Open test-local.html directly in your browser
        echo (Note: Some features may not work due to CORS restrictions)
        pause
    )
)