@echo off
echo Updating build information...
echo ================================

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Node.js to update build info...
    node update-build-info.js
) else (
    echo Node.js not found, updating manually...
    
    REM Get Git commit info manually
    for /f %%i in ('git rev-parse --short HEAD') do set SHORT_COMMIT=%%i
    for /f %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i
    
    echo Short Commit: %SHORT_COMMIT%
    echo Branch: %BRANCH%
    echo.
    echo Please manually update build-info.js with:
    echo - commitId: %SHORT_COMMIT%
    echo - branch: %BRANCH%
    echo - buildDate: current timestamp
)

echo.
echo Build info update complete!
pause