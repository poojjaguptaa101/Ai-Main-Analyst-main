import time
import re
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from app.engine.data_store import data_store

FORBIDDEN_KEYWORDS = [
    "drop ", "delete ", "truncate ", "alter ", "insert ", "update ",
    "create ", "vacuum", "attach", "detach", "copy ", "write_csv", "install ", "load "
]

class SQLEngine:
    @staticmethod
    def is_safe(sql: str) -> bool:
        lowered = f" {sql.lower()} "
        for kw in FORBIDDEN_KEYWORDS:
            if re.search(r'\b' + re.escape(kw.strip()) + r'\b', lowered):
                return False
        return True

    @staticmethod
    def execute(sql: str) -> Dict[str, Any]:
        cleaned_sql = sql.strip().rstrip(';')
        if not cleaned_sql:
            raise ValueError("Empty SQL query provided.")

        if not SQLEngine.is_safe(cleaned_sql):
            raise PermissionError("Destructive or unauthorized SQL statements are blocked for security.")

        start_time = time.perf_counter()
        try:
            rel = data_store.conn.execute(cleaned_sql)
            df = rel.df()
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            # Extract column names and format rows
            columns = df.columns.tolist()
            # Replace NaNs/Infs with None for clean JSON serialization
            sanitized_df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
            rows = sanitized_df.to_dict(orient="records")

            # Try getting explain plan
            explain_plan = ""
            try:
                exp_res = data_store.conn.execute(f"EXPLAIN {cleaned_sql}").fetchall()
                explain_plan = "\n".join([str(r[1]) for r in exp_res if len(r) > 1])
            except Exception:
                pass

            return {
                "success": True,
                "sql": cleaned_sql,
                "columns": columns,
                "rows": rows[:500], # Cap at 500 rows for response payload
                "total_rows": len(df),
                "execution_time_ms": elapsed_ms,
                "explain_plan": explain_plan
            }
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": False,
                "sql": cleaned_sql,
                "error": str(e),
                "execution_time_ms": elapsed_ms
            }

sql_engine = SQLEngine()
