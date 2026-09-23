import io
from datetime import datetime
from fastapi import APIRouter, Response
from app.engine.data_store import data_store
from app.agent.memory import conversation_memory
from app.engine.data_quality import data_quality_profiler

router = APIRouter(prefix="/api/export", tags=["Report Export"])

@router.get("/html")
def export_html_report(session_id: str = "default_session"):
    history = conversation_memory.get_history(session_id)
    quality = data_quality_profiler.audit_all()
    tables = data_store.get_all_metadata()
    now_str = datetime.now().strftime("%B %d, %Y - %H:%M:%S")

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>DataMind AI — Executive Data Intelligence Report</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #f8fafc; }}
            .header {{ border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }}
            .header h1 {{ margin: 0; color: #0f172a; font-size: 28px; }}
            .header p {{ margin: 5px 0 0; color: #64748b; font-size: 14px; }}
            .badge {{ display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #3730a3; border-radius: 9999px; font-weight: 600; font-size: 12px; }}
            .card {{ background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }}
            .card h2 {{ margin-top: 0; font-size: 18px; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }}
            th, td {{ padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
            th {{ background: #f8fafc; color: #475569; font-weight: 600; }}
            code {{ background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #0f172a; }}
            .sql-box {{ background: #0f172a; color: #38bdf8; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 13px; overflow-x: auto; }}
            .insight-pill {{ background: #ecfdf5; border-left: 4px solid #10b981; padding: 10px 16px; margin-bottom: 10px; font-size: 14px; color: #065f46; }}
            @media print {{ body {{ background: white; padding: 0; }} .card {{ box-shadow: none; border: 1px solid #cbd5e1; }} }}
        </style>
    </head>
    <body>
        <div class="header">
            <span class="badge">Digital Back Office Ltd. — AI Data Intelligence</span>
            <h1>DataMind AI — Executive Summary Report</h1>
            <p>Generated on {now_str} | Session: <code>{session_id}</code></p>
        </div>

        <div class="card">
            <h2>Analytical Workspace & Data Health Score</h2>
            <p><strong>Overall Data Quality Score:</strong> <span class="badge" style="background:#dcfce7;color:#166534;">{quality.get('overall_score', 100)}% Health</span></p>
            <table>
                <thead><tr><th>Table Name</th><th>Row Count</th><th>Columns</th><th>Completeness</th><th>Duplicates</th></tr></thead>
                <tbody>
    """
    for tbl, meta in tables.items():
        q_tbl = quality.get("tables", {}).get(tbl, {})
        comp = q_tbl.get("completeness_pct", 100)
        dups = q_tbl.get("duplicate_rows", 0)
        html_content += f"""
            <tr>
                <td><strong>{tbl}</strong></td>
                <td>{meta['row_count']:,}</td>
                <td>{meta['column_count']}</td>
                <td>{comp}%</td>
                <td>{dups}</td>
            </tr>
        """
    
    html_content += """
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Key Analytical Findings & Query Transcripts</h2>
    """

    if not history:
        html_content += "<p>No conversational queries executed in this session yet.</p>"
    else:
        for turn in history:
            if turn.get("role") == "user":
                html_content += f"<h3 style='color:#3b82f6;margin-top:20px;'>Query: &ldquo;{turn.get('content')}&rdquo;</h3>"
            elif turn.get("role") == "assistant":
                resp = turn.get("content", "")
                sql = turn.get("sql_query")
                insights = turn.get("insights", [])
                
                html_content += f"<p>{resp}</p>"
                if sql:
                    html_content += f"<div class='sql-box'>{sql}</div>"
                if insights:
                    for ins in insights:
                        html_content += f"<div class='insight-pill'>&#10003; {ins}</div>"

    html_content += """
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:40px;">
            Generated autonomously by DataMind AI — Production AI Data Analyst Engine.
        </p>
    </body>
    </html>
    """
    return Response(content=html_content, media_type="text/html")
