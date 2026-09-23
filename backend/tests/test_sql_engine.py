import pytest
import pandas as pd
from app.engine.data_store import data_store
from app.engine.sql_engine import sql_engine

def setup_module():
    df = pd.DataFrame({
        "dept": ["Engineering", "Sales", "Marketing"],
        "budget": [500000, 300000, 200000]
    })
    data_store.register_dataframe("dept_budget", df)

def test_sql_execution_success():
    res = sql_engine.execute("SELECT dept, budget FROM dept_budget ORDER BY budget DESC")
    assert res["success"] is True
    assert len(res["rows"]) == 3
    assert res["rows"][0]["dept"] == "Engineering"
    assert res["execution_time_ms"] >= 0

def test_sql_safety_blocks_destructive():
    with pytest.raises(PermissionError):
        sql_engine.execute("DROP TABLE dept_budget;")
    with pytest.raises(PermissionError):
        sql_engine.execute("DELETE FROM dept_budget WHERE budget > 0;")
