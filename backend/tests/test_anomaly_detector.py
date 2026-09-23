import pytest
import numpy as np
import pandas as pd
from app.engine.data_store import data_store
from app.engine.anomaly_detector import anomaly_detector

def setup_module():
    np.random.seed(42)
    # Generate 100 normal numbers and 2 extreme outliers
    amounts = np.random.normal(100, 15, 100).tolist()
    amounts.append(5000.0) # Outlier 1
    amounts.append(0.01)   # Outlier 2
    
    df = pd.DataFrame({"txn_id": range(len(amounts)), "amount": amounts})
    data_store.register_dataframe("transactions_test", df)

def test_isolation_forest_anomalies():
    res = anomaly_detector.detect("transactions_test", method="isolation_forest", contamination=0.03)
    assert res["anomaly_count"] >= 1
    assert len(res["flagged_records"]) >= 1
    assert "explanation" in res["flagged_records"][0]

def test_z_score_anomalies():
    res = anomaly_detector.detect("transactions_test", method="z_score", z_threshold=3.0)
    assert res["anomaly_count"] >= 1
    # Check that explanation mentions standard deviations
    first_exp = res["flagged_records"][0]["explanation"]
    assert "std deviation" in first_exp or "mean" in first_exp
