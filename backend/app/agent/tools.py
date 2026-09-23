from typing import Dict, Any, List

AVAILABLE_TOOLS = [
    {
        "name": "run_sql",
        "description": "Execute a DuckDB SQL query on loaded tables to retrieve metrics, aggregations, joins, or filters.",
        "parameters": {
            "type": "object",
            "properties": {
                "sql": {"type": "string", "description": "The exact SQL query to execute."}
            },
            "required": ["sql"]
        }
    },
    {
        "name": "run_pandas",
        "description": "Execute sandboxed Python/Pandas code for statistical or dataframe transformations.",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Python code using 'pd' and registered table names."}
            },
            "required": ["code"]
        }
    },
    {
        "name": "detect_anomalies",
        "description": "Detect statistical or ML anomalies (Isolation Forest, Z-score, IQR) on a table.",
        "parameters": {
            "type": "object",
            "properties": {
                "table_name": {"type": "string", "description": "Name of the table to scan."},
                "method": {"type": "string", "enum": ["isolation_forest", "z_score", "iqr"], "default": "isolation_forest"},
                "columns": {"type": "array", "items": {"type": "string"}, "description": "Specific numerical columns to check."}
            },
            "required": ["table_name"]
        }
    },
    {
        "name": "forecast_metric",
        "description": "Generate time-series projections with confidence bands for a metric over future periods.",
        "parameters": {
            "type": "object",
            "properties": {
                "table_name": {"type": "string", "description": "Target table."},
                "date_column": {"type": "string", "description": "Datetime column."},
                "value_column": {"type": "string", "description": "Numerical metric column."},
                "horizon": {"type": "integer", "description": "Periods ahead to forecast.", "default": 6}
            },
            "required": ["table_name", "date_column", "value_column"]
        }
    },
    {
        "name": "data_quality_audit",
        "description": "Audit data health, null percentages, duplicates, and column cardinality.",
        "parameters": {
            "type": "object",
            "properties": {
                "table_name": {"type": "string", "description": "Target table."}
            },
            "required": ["table_name"]
        }
    }
]
