import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def setup_module():
    client.post("/api/load-samples")

def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_load_samples_and_tables():
    resp = client.post("/api/load-samples")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["tables"]) >= 4

    resp_tables = client.get("/api/tables")
    assert resp_tables.status_code == 200
    assert "sales_data" in resp_tables.json()["tables"]

def test_chat_query_highest_revenue():
    resp = client.post("/api/chat", json={
        "session_id": "pytest_session",
        "message": "Which region generated the highest revenue?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "North" in data["response"] or "North" in str(data.get("insights", []))
    assert data["sql_query"] is not None
    assert len(data["thought_process"]) > 0

def test_chat_query_monthly_trends():
    resp = client.post("/api/chat", json={
        "session_id": "pytest_session",
        "message": "Show monthly sales trends."
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["chart_spec"] is not None
    assert data["chart_spec"]["type"] == "line"

def test_chat_query_top_customers():
    resp = client.post("/api/chat", json={
        "session_id": "pytest_session",
        "message": "What are the top five customers?"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["sql_query"] is not None
    assert "LIMIT 5" in data["sql_query"].upper()

def test_dashboard():
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["has_data"] is True
    assert len(data["kpis"]) >= 3

def test_data_quality():
    resp = client.get("/api/quality/audit")
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_score" in data

def test_evaluation_suite():
    resp = client.get("/api/evaluate/run")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["accuracy_score_pct"] == 100.0

def test_html_report_export():
    resp = client.get("/api/export/html?session_id=pytest_session")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
    assert "DataMind AI" in resp.text

def test_vague_query_clarification():
    # Single-word / greeting query
    resp = client.post("/api/chat", json={
        "session_id": "pytest_session",
        "message": "hello"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "clarify" in str(data.get("action", "")).lower() or len(data.get("suggested_questions", [])) > 0
    assert len(data.get("suggested_questions", [])) >= 3

def test_entity_lookup_narrative():
    # Specific order ID query
    resp = client.post("/api/chat", json={
        "session_id": "pytest_session",
        "message": "Tell me about order ORD-00042"
    })
    assert resp.status_code == 200
    data = resp.json()
    text = data.get("response", "")
    assert "ORD-00042" in text
    # Should contain business narrative (e.g. units, bulk, revenue, or average)
    assert len(text.split(".")) >= 2

