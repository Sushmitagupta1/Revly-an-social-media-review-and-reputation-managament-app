@echo off
echo Starting Revly...
start "Revly Backend" cmd /c "cd /d D:\Revly\backend && python -m uvicorn app.main:app --reload --port 8000"
start "Revly Frontend" cmd /c "cd /d D:\Revly\frontend && npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo Revly is running!
