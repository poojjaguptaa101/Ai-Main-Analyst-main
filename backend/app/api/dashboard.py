from fastapi import APIRouter
from typing import Dict, Any, List
from app.engine.data_store import data_store
from app.engine.sql_engine import sql_engine

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("")
def generate_auto_dashboard() -> Dict[str, Any]:
    tables = data_store.get_tables()
    if not tables:
        return {"has_data": False, "message": "No datasets uploaded yet."}

    primary_table = "sales_data" if "sales_data" in tables else tables[0]
    meta = data_store.get_metadata(primary_table)
    cols = meta["columns"]

    # 1. Generate Executive KPI Cards
    kpis = [
        {"title": "Total Records", "value": f"{meta['row_count']:,}", "subtitle": f"Across table '{primary_table}'", "icon": "database"},
        {"title": "Columns Tracked", "value": f"{meta['column_count']}", "subtitle": "Categorical & numeric dimensions", "icon": "table"}
    ]

    # Look for revenue / amount
    if "revenue" in cols or "amount" in cols:
        col_name = "revenue" if "revenue" in cols else "amount"
        rev_q = sql_engine.execute(f"SELECT ROUND(SUM({col_name}), 2) as total_val, ROUND(AVG({col_name}), 2) as avg_val FROM {primary_table}")
        if rev_q["success"] and rev_q["rows"]:
            t_val = rev_q["rows"][0]["total_val"] or 0
            a_val = rev_q["rows"][0]["avg_val"] or 0
            kpis.append({"title": f"Total {col_name.title()}", "value": f"${t_val:,.2f}", "subtitle": f"Mean order: ${a_val:,.2f}", "icon": "dollar-sign"})

    # Look for profit
    if "profit" in cols:
        prof_q = sql_engine.execute(f"SELECT ROUND(SUM(profit), 2) as total_profit, ROUND(AVG(profit_margin), 1) as avg_margin FROM {primary_table}")
        if prof_q["success"] and prof_q["rows"]:
            t_prof = prof_q["rows"][0]["total_profit"] or 0
            a_marg = prof_q["rows"][0]["avg_margin"] or 0
            kpis.append({"title": "Total Net Profit", "value": f"${t_prof:,.2f}", "subtitle": f"Avg Margin: {a_marg}%", "icon": "trending-up"})

    # 2. Key Distribution Charts
    charts = []
    if "region" in cols and ("revenue" in cols or "amount" in cols):
        v = "revenue" if "revenue" in cols else "amount"
        q_reg = sql_engine.execute(f"SELECT region, ROUND(SUM({v}), 2) as val FROM {primary_table} GROUP BY region ORDER BY val DESC")
        if q_reg["success"]:
            charts.append({
                "type": "bar",
                "title": f"{v.title()} by Region",
                "labels": [r["region"] for r in q_reg["rows"]],
                "values": [r["val"] for r in q_reg["rows"]],
                "color": "#3B82F6"
            })

    # Look for monthly trend
    date_col = next((c for c in cols if "date" in c or "time" in c), None)
    if date_col and ("revenue" in cols or "amount" in cols):
        v = "revenue" if "revenue" in cols else "amount"
        q_month = sql_engine.execute(f"SELECT strftime('%Y-%m', CAST({date_col} AS DATE)) as m, ROUND(SUM({v}), 2) as val FROM {primary_table} WHERE {date_col} IS NOT NULL GROUP BY m ORDER BY m ASC LIMIT 12")
        if q_month["success"]:
            charts.append({
                "type": "line",
                "title": f"Monthly {v.title()} Velocity",
                "labels": [r["m"] for r in q_month["rows"]],
                "values": [r["val"] for r in q_month["rows"]],
                "color": "#10B981"
            })

    # Category pie chart if products table or category col
    cat_col = next((c for c in cols if "category" in c or "segment" in c or "channel" in c), None)
    if cat_col:
        q_cat = sql_engine.execute(f"SELECT {cat_col}, COUNT(*) as cnt FROM {primary_table} GROUP BY {cat_col} ORDER BY cnt DESC LIMIT 6")
        if q_cat["success"]:
            charts.append({
                "type": "pie",
                "title": f"Volume Breakdown by {cat_col.replace('_', ' ').title()}",
                "labels": [str(r[cat_col]) for r in q_cat["rows"]],
                "values": [r["cnt"] for r in q_cat["rows"]],
                "color": "#8B5CF6"
            })

    return {
        "has_data": True,
        "primary_table": primary_table,
        "kpis": kpis,
        "charts": charts,
        "tables_loaded": len(tables),
        "relationships_detected": len(data_store.foreign_keys)
    }
