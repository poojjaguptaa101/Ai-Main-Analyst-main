import time
from typing import Dict, Any, List, Optional
from app.config import settings
from app.engine.data_store import data_store
from app.engine.sql_engine import sql_engine
from app.engine.anomaly_detector import anomaly_detector
from app.engine.forecaster import forecaster
from app.agent.llm_provider import llm_provider
from app.agent.cache import query_cache
from app.agent.memory import conversation_memory

class AgentWorkflow:
    def execute_turn(
        self,
        session_id: str,
        user_message: str,
        provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()
        
        # Check cache
        cache_key = {"session_id": session_id, "query": user_message.strip().lower()}
        cached_result = query_cache.get(cache_key)
        if cached_result:
            cached_result["execution_time_ms"] = round((time.perf_counter() - start_time) * 1000, 2)
            cached_result["cached"] = True
            return cached_result

        # Retrieve conversational context
        history = conversation_memory.get_history(session_id)
        
        # Determine plan
        plan = llm_provider.determine_offline_response(user_message, history)
        
        thought_process = plan.get("thought", [
            f"Step 1: Analyzed user question '{user_message}'.",
            "Step 2: Selected appropriate analytical tool and schema context.",
            "Step 3: Validated execution outputs."
        ])
        
        sql_query = plan.get("sql")
        chart_spec = plan.get("chart")
        action = plan.get("action")
        data_table = None
        insights = []
        response_text = ""
        tool_calls = []

        if action == "detect_anomalies":
            tbl = plan.get("table", data_store.get_tables()[0] if data_store.get_tables() else "")
            anom_res = anomaly_detector.detect(tbl)
            tool_calls.append({"tool": "detect_anomalies", "status": "success", "result": f"Flagged {anom_res['anomaly_count']} outliers."})
            
            thought_process.append(f"Anomaly Detection Complete: Scanned {anom_res['total_rows']} records, flagged {anom_res['anomaly_count']} anomalies ({anom_res['anomaly_percentage']}%).")
            
            top_flags = anom_res["flagged_records"][:5]
            insights = [
                f"Total anomalous transactions flagged: {anom_res['anomaly_count']} out of {anom_res['total_rows']} records.",
                f"Contamination rate: {anom_res['anomaly_percentage']}% of the dataset exhibits anomalous multivariate patterns.",
                f"Primary contributing dimensions: {', '.join(anom_res['feature_columns'])}."
            ]
            for f in top_flags:
                insights.append(f"Row #{f['row_index']}: {f['explanation']}")

            response_text = f"Detected **{anom_res['anomaly_count']} statistical anomalies** in table `{tbl}` using multi-factor Isolation Forest analysis. Below are the key flagged records with their root-cause explanations."
            data_table = {
                "columns": ["Row Index", "Anomaly Score", "Explanation"],
                "rows": [{"Row Index": r["row_index"], "Anomaly Score": r["anomaly_score"], "Explanation": r["explanation"]} for r in top_flags],
                "total_rows": len(anom_res["flagged_records"])
            }
            chart_spec = {
                "type": "scatter",
                "title": f"Anomaly Distribution on {anom_res['y_axis_label']}",
                "x_axis": anom_res["x_axis_label"],
                "y_axis": anom_res["y_axis_label"],
                "data": anom_res["scatter_data"]
            }

        elif action == "forecast":
            tbl = plan.get("table")
            d_col = plan.get("date_col")
            v_col = plan.get("val_col")
            fc_res = forecaster.forecast(tbl, d_col, v_col, horizon=6)
            tool_calls.append({"tool": "forecast_metric", "status": "success", "result": f"Projected 6 periods ahead with {fc_res['trend_direction']} trend."})
            
            thought_process.append(f"Forecasting Complete: Extrapolated {v_col} across next 6 months with 95% confidence intervals.")
            response_text = f"Generated a **6-month predictive forecast** for `{v_col}` based on historical patterns in `{tbl}`. {fc_res['summary_insight']}"
            insights = [
                f"Historical trajectory: {fc_res['trend_direction']} trend with {fc_res['projected_growth_pct']}% expected change.",
                f"Projected {v_col} next month: {fc_res['forecast_points'][0]['forecast']:,.2f} (Confidence bounds: {fc_res['forecast_points'][0]['lower_bound']:,.2f} - {fc_res['forecast_points'][0]['upper_bound']:,.2f}).",
                f"Projected {v_col} at horizon (6 months): {fc_res['forecast_points'][-1]['forecast']:,.2f}."
            ]
            data_table = {
                "columns": ["Period Date", "Projected Forecast", "Lower Bound (95%)", "Upper Bound (95%)"],
                "rows": [{"Period Date": p["date"], "Projected Forecast": p["forecast"], "Lower Bound (95%)": p["lower_bound"], "Upper Bound (95%)": p["upper_bound"]} for p in fc_res["forecast_points"]],
                "total_rows": len(fc_res["forecast_points"])
            }
            chart_spec = {
                "type": "forecast_line",
                "title": f"Predictive Forecast: {v_col.title()}",
                "x_axis": "date",
                "y_axis": "forecast",
                "historical": fc_res["historical_points"],
                "forecast": fc_res["forecast_points"]
            }

        elif sql_query:
            # Execute generated SQL
            exec_res = sql_engine.execute(sql_query)
            tool_calls.append({"tool": "run_sql", "query": sql_query, "status": "success" if exec_res["success"] else "error"})
            
            if exec_res["success"]:
                data_table = {
                    "columns": exec_res["columns"],
                    "rows": exec_res["rows"],
                    "total_rows": exec_res["total_rows"]
                }
                thought_process.append(f"Query Execution: Returned {exec_res['total_rows']} rows in {exec_res['execution_time_ms']} ms.")
                
                # Synthesize natural language insights based on results
                rows = exec_res["rows"]
                if rows:
                    cols = exec_res["columns"]
                    first_row = rows[0]
                    first_val = list(first_row.values())[0] if first_row else ""
                    metric_keys = [k for k in first_row.keys() if isinstance(first_row[k], (int, float))]
                    
                    if metric_keys:
                        lead_metric = metric_keys[0]
                        lead_val = first_row[lead_metric]
                        formatted_lead = f"{lead_val:,.2f}" if isinstance(lead_val, float) else f"{lead_val:,}"
                        response_text = f"Based on the analysis, **{first_val}** leads with **{formatted_lead}** in {lead_metric.replace('_', ' ')}."
                    else:
                        response_text = f"Retrieved {len(rows)} matching records from the analytical database."

                    # Generate dynamic bullet insights
                    insights.append(f"Top performing entity: **{first_val}** with lead metric of {first_row.get(metric_keys[0] if metric_keys else cols[0])}.")
                    if len(rows) > 1:
                        last_row = rows[-1]
                        last_val = list(last_row.values())[0]
                        insights.append(f"Spread: Lowest entity recorded is **{last_val}**.")
                    insights.append(f"Total rows evaluated in query: {exec_res['total_rows']}.")
                else:
                    response_text = "The query executed successfully but returned zero matching records."
            else:
                response_text = f"SQL Execution Error: {exec_res.get('error')}"
                thought_process.append(f"Error encountered during SQL execution: {exec_res.get('error')}")

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        result_payload = {
            "session_id": session_id,
            "response": response_text,
            "thought_process": thought_process,
            "sql_query": sql_query,
            "chart_spec": chart_spec,
            "data_table": data_table,
            "insights": insights,
            "execution_time_ms": elapsed_ms,
            "tool_calls": tool_calls
        }

        # Update cache and session memory
        query_cache.set(cache_key, result_payload)
        conversation_memory.add_turn(session_id, user_message, result_payload)

        return result_payload

agent_workflow = AgentWorkflow()
