from fastapi import APIRouter
from app.agent.cache import query_cache
from app.engine.data_store import data_store

router = APIRouter(prefix="/api/observability", tags=["Observability & Metrics"])

@router.get("/stats")
def get_observability_stats():
    cache_info = query_cache.stats()
    tables = data_store.get_tables()
    total_records = sum([data_store.table_metadata[t]["row_count"] for t in tables])
    
    return {
        "active_tables": len(tables),
        "total_records_indexed": total_records,
        "detected_relationships": len(data_store.foreign_keys),
        "cache": cache_info,
        "system_status": "Healthy",
        "duckdb_version": "1.0+",
        "engine_architecture": "ReAct Tool-Calling Agent + DuckDB OLAP Engine"
    }
