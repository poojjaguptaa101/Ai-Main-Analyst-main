import pytest
import pandas as pd
from datetime import datetime, timedelta
from app.engine.data_store import data_store
from app.engine.forecaster import forecaster

def setup_module():
    start = datetime(2023, 1, 1)
    dates = [(start + timedelta(days=i*30)).strftime("%Y-%m-%d") for i in range(12)]
    revs = [10000 + i * 1500 for i in range(12)] # Clear upward trend
    df = pd.DataFrame({"order_date": dates, "revenue": revs})
    data_store.register_dataframe("ts_test", df)

def test_forecast_upward_trend():
    res = forecaster.forecast("ts_test", "order_date", "revenue", horizon=4)
    assert res["trend_direction"] == "Upward"
    assert len(res["forecast_points"]) == 4
    assert res["forecast_points"][-1]["forecast"] > res["forecast_points"][0]["forecast"]
    assert "upper_bound" in res["forecast_points"][0]
    assert "lower_bound" in res["forecast_points"][0]
    assert res["projected_growth_pct"] > 0
    assert "upward" in res["summary_insight"].lower()

def test_forecaster_trajectory_consistency():
    # Downward series
    start = datetime(2023, 1, 1)
    dates = [(start + timedelta(days=i*30)).strftime("%Y-%m-%d") for i in range(12)]
    revs = [50000 - i * 3000 for i in range(12)] # Clear downward trend
    df_down = pd.DataFrame({"order_date": dates, "revenue": revs})
    data_store.register_dataframe("ts_down", df_down)

    res_down = forecaster.forecast("ts_down", "order_date", "revenue", horizon=3)
    assert res_down["trend_direction"] == "Downward"
    assert res_down["projected_growth_pct"] < 0
    assert "downward" in res_down["summary_insight"].lower()
    # Ensure clamp range [-90%, 200%]
    assert -90.0 <= res_down["projected_growth_pct"] <= 200.0

