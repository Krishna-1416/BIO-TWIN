@echo off
echo ===================================================
echo   🚀 STARTING BIO-TWIN DEMO ENVIRONMENT
echo ===================================================

echo.
echo [1/2] Launching Backend Server (FastAPI)...
start "Bio-Twin Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo.
echo [2/2] Launching Frontend Server (Vite)...
start "Bio-Twin Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   ✅ SERVERS STARTED!
echo   backend: http://localhost:8000
echo   frontend: http://localhost:5173
echo ===================================================
echo.
echo Note: It may take a few seconds for servers to be ready.
echo Press any key to exit this launcher (servers will stay open).
pause
