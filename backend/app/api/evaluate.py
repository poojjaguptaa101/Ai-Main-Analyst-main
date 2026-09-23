import time
from fastapi import APIRouter
from typing import Dict, Any, List
from app.engine.data_store import data_store
from app.agent.agent_workflow import agent_workflow

router = APIRouter(prefix="/api/evaluate", tags=["Evaluation Benchmark"])

BENCHMARK_CASES = [
    {
        "id": "TC-01",
        "category": "Regional Aggregation",
        "question": "Which region generated the highest revenue?",
        "expected_tool": "run_sql",
        "expected_keyword": "North"
    },
    {
        "id": "TC-02",
        "category": "Time-Series Trends",
        "question": "Show monthly sales trends.",
        "expected_tool": "run_sql",
        "expected_keyword": "month"
    },
    {
        "id": "TC-03",
        "category": "Bottom Ranking",
        "question": "Which products are underperforming?",
        "expected_tool": "run_sql",
        "expected_keyword": "profit"
    },
    {
        "id": "TC-04",
        "category": "Top Ranking",
        "question": "What are the top five customers?",
        "expected_tool": "run_sql",
        "expected_keyword": "customer"
    },
    {
        "id": "TC-05",
        "category": "Anomaly Detection",
        "question": "Detect anomalies in the dataset.",
        "expected_tool": "detect_anomalies",
        "expected_keyword": "anomal"
    },
    {
        "id": "TC-06",
        "category": "Vague / Ambiguous Query",
        "question": "hello",
        "expected_tool": "clarify",
        "expected_keyword": "clarify"
    },
    {
        "id": "TC-07",
        "category": "Specific Entity Lookup",
        "question": "Tell me about order ORD-00042",
        "expected_tool": "run_sql",
        "expected_keyword": "ORD-00042"
    }
]

@router.get("/run")
def run_evaluation_benchmark() -> Dict[str, Any]:
    tables = data_store.get_tables()
    if not tables:
        return {"status": "error", "message": "Please load datasets first before running evaluation suite."}

    results = []
    total_time = 0.0
    passed = 0

    for tc in BENCHMARK_CASES:
        t0 = time.perf_counter()
        res = agent_workflow.execute_turn("eval_session", tc["question"])
        elapsed = round((time.perf_counter() - t0) * 1000, 2)
        total_time += elapsed

        # Verification criteria
        has_sql = bool(res.get("sql_query"))
        has_insights = len(res.get("insights", [])) > 0
        has_thought = len(res.get("thought_process", [])) > 0
        is_clarify = res.get("action") == "clarify"
        is_pass = has_thought and (has_sql or res.get("data_table") or is_clarify) and has_insights
        
        if is_pass:
            passed += 1

        results.append({
            "test_id": tc["id"],
            "category": tc["category"],
            "question": tc["question"],
            "passed": is_pass,
            "latency_ms": elapsed,
            "generated_sql": res.get("sql_query"),
            "insights_generated": len(res.get("insights", [])),
            "thought_steps": len(res.get("thought_process", []))
        })

    accuracy_pct = round((passed / len(BENCHMARK_CASES)) * 100, 1)

    return {
        "status": "success",
        "total_tests": len(BENCHMARK_CASES),
        "passed": passed,
        "failed": len(BENCHMARK_CASES) - passed,
        "accuracy_score_pct": accuracy_pct,
        "average_latency_ms": round(total_time / len(BENCHMARK_CASES), 2),
        "results": results
    }
