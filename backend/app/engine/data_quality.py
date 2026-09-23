import numpy as np
import pandas as pd
from typing import Dict, Any, List
from app.engine.data_store import data_store

class DataQualityProfiler:
    @staticmethod
    def audit_table(table_name: str) -> Dict[str, Any]:
        df = data_store.get_df(table_name)
        if df is None:
            raise ValueError(f"Table '{table_name}' does not exist.")

        total_rows = len(df)
        total_cols = len(df.columns)
        total_cells = total_rows * total_cols

        # Null analysis
        null_counts = df.isnull().sum().to_dict()
        null_cells = sum(null_counts.values())
        completeness_pct = round((1 - (null_cells / max(total_cells, 1))) * 100, 2)

        # Duplicate analysis
        duplicate_rows = int(df.duplicated().sum())
        uniqueness_pct = round((1 - (duplicate_rows / max(total_rows, 1))) * 100, 2)

        # Column profiles
        col_profiles = []
        recommendations = []

        for col in df.columns:
            nulls = int(null_counts[col])
            null_pct = round((nulls / max(total_rows, 1)) * 100, 2)
            n_unique = int(df[col].nunique())
            dtype = str(df[col].dtype)
            
            is_num = np.issubdtype(df[col].dtype, np.number)
            outlier_count = 0

            if is_num and total_rows > 5:
                vals = df[col].dropna()
                q1 = vals.quantile(0.25)
                q3 = vals.quantile(0.75)
                iqr = q3 - q1
                outlier_count = int(((vals < q1 - 1.5 * iqr) | (vals > q3 + 1.5 * iqr)).sum())

            if null_pct > 15.0:
                recommendations.append(f"Column '{col}' has high null rate ({null_pct}%). Consider imputation or defaulting.")
            if outlier_count > 0:
                recommendations.append(f"Column '{col}' contains {outlier_count} statistical outliers.")

            col_profiles.append({
                "column": col,
                "data_type": dtype,
                "null_count": nulls,
                "null_pct": null_pct,
                "unique_values": n_unique,
                "cardinality_ratio": round(n_unique / max(total_rows, 1), 3),
                "outlier_count": outlier_count
            })

        if duplicate_rows > 0:
            recommendations.append(f"Found {duplicate_rows} duplicate rows. Consider de-duplicating before downstream modeling.")

        # Overall Health Score (0 - 100)
        penalty = (100 - completeness_pct) * 0.4 + (100 - uniqueness_pct) * 0.3
        health_score = max(0, min(100, round(100 - penalty, 1)))

        return {
            "table_name": table_name,
            "health_score": health_score,
            "total_rows": total_rows,
            "total_columns": total_cols,
            "total_cells": total_cells,
            "completeness_pct": completeness_pct,
            "duplicate_rows": duplicate_rows,
            "uniqueness_pct": uniqueness_pct,
            "column_profiles": col_profiles,
            "recommendations": recommendations or ["Dataset schema and values are clean with no immediate anomalies."]
        }

    @staticmethod
    def audit_all() -> Dict[str, Any]:
        tables = data_store.get_tables()
        if not tables:
            return {"tables": {}, "overall_score": 100.0}

        results = {}
        scores = []
        for tbl in tables:
            res = DataQualityProfiler.audit_table(tbl)
            results[tbl] = res
            scores.append(res["health_score"])

        return {
            "tables": results,
            "overall_score": round(sum(scores) / max(len(scores), 1), 1)
        }

data_quality_profiler = DataQualityProfiler()
