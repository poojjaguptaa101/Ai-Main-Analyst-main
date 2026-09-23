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
