@echo off
echo Starting Backend...
cd server
npm run dev
if %errorlevel% neq 0 (
    echo "npm run dev failed, trying node index.js..."
    node index.js
)
pause
