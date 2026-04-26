@echo off
echo 🚀 Starting Family Tree Server with Cache Control...
echo 📱 Mobile-optimized for latest version delivery
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python first.
    pause
    exit /b 1
)

REM Start the enhanced server
echo 🔄 Starting server on http://localhost:8000
echo 💡 Use this server for better mobile cache control
echo.
python server.py

pause