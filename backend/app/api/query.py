from fastapi import APIRouter
from app.models.schemas import QuerySQLRequest, QueryPandasRequest
from app.engine.sql_engine import sql_engine
from app.engine.pandas_sandbox import pandas_sandbox

router = APIRouter(prefix="/api/query", tags=["Direct Query Execution"])

@router.post("/sql")
def execute_sql(req: QuerySQLRequest):
    return sql_engine.execute(req.sql)

@router.post("/pandas")
def execute_pandas(req: QueryPandasRequest):
    return pandas_sandbox.execute(req.code)
