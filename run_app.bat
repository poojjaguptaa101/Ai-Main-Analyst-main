@echo off
echo ===================================================
echo   Starting DataMind AI - Autonomous Data Analyst
echo   Digital Back Office Ltd. Assignment
echo ===================================================

cd /d %~dp0
set PYTHONPATH=backend

echo Starting backend server on http://localhost:8000...
start "" http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
