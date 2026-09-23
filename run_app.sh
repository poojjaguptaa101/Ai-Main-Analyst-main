#!/usr/bin/env bash
echo "==================================================="
echo "  Starting DataMind AI - Autonomous Data Analyst"
echo "  Digital Back Office Ltd. Assignment"
echo "==================================================="

export PYTHONPATH=backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
