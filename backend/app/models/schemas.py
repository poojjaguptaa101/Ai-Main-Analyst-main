from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field

class FileUploadResponse(BaseModel):
    table_name: str
    row_count: int
    column_count: int
    columns: List[str]
    column_types: Dict[str, str]
    preview: List[Dict[str, Any]]
    summary_stats: Dict[str, Any]

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str
    thought_process: Optional[List[str]] = None
    sql_query: Optional[str] = None
    pandas_code: Optional[str] = None
    chart_spec: Optional[Dict[str, Any]] = None
    data_table: Optional[Dict[str, Any]] = None
    insights: Optional[List[str]] = None
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str = "default_session"
    message: str
    active_tables: Optional[List[str]] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    response: str
    thought_process: List[str]
    sql_query: Optional[str] = None
    pandas_code: Optional[str] = None
    chart_spec: Optional[Dict[str, Any]] = None
    data_table: Optional[Dict[str, Any]] = None
    insights: List[str]
    execution_time_ms: float
    tool_calls: List[Dict[str, Any]] = []

class QuerySQLRequest(BaseModel):
    sql: str

class QueryPandasRequest(BaseModel):
    code: str

class AnomalyDetectRequest(BaseModel):
    table_name: str
    feature_columns: Optional[List[str]] = None
    method: str = "isolation_forest" # "isolation_forest", "z_score", "iqr"
    contamination: float = 0.05
    z_threshold: float = 3.0

class ForecastRequest(BaseModel):
    table_name: str
    date_column: str
    value_column: str
    aggregation: str = "month" # "day", "week", "month"
    horizon: int = 6 # periods ahead
