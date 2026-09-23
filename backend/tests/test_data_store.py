import pytest
import pandas as pd
from app.engine.data_store import data_store

def test_register_dataframe():
    df = pd.DataFrame({
        "User ID": [1, 2, 3],
        "Gross Revenue": [100.5, 250.0, 310.2],
        "Region": ["North", "South", "East"]
    })
    meta = data_store.register_dataframe("test_sales", df)
    assert meta["table_name"] == "test_sales"
    assert meta["row_count"] == 3
    assert "gross_revenue" in meta["columns"]
    assert "user_id" in meta["columns"]
    assert "test_sales" in data_store.get_tables()

def test_relationship_detection():
    df_orders = pd.DataFrame({"order_id": [1, 2], "customer_id": [10, 20]})
    df_cust = pd.DataFrame({"customer_id": [10, 20], "name": ["Alice", "Bob"]})
    data_store.register_dataframe("orders", df_orders)
    data_store.register_dataframe("customers", df_cust)
    
    assert len(data_store.foreign_keys) >= 1
    fk = data_store.foreign_keys[0]
    assert fk["column"] == "customer_id"
