from fastapi import APIRouter
from app.engine.data_quality import data_quality_profiler

router = APIRouter(prefix="/api/quality", tags=["Data Quality"])

@router.get("/audit")
def audit_data_quality():
    return data_quality_profiler.audit_all()

@router.get("/audit/{table_name}")
def audit_single_table(table_name: str):
    return data_quality_profiler.audit_table(table_name)
