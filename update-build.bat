@echo off
echo Updating commit information...
echo ================================

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Node.js to generate commit info...
    node generate-commit-info.cjs
) else (
    echo Node.js not found!
    echo Please install Node.js to automatically generate commit info.
    echo.
    echo Alternative: Manually create commit-info.json with current Git info
    pause
)

echo.
echo Commit info update complete!
echo Remember to commit and push commit-info.json to GitHub!
pause