import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.ensemble import IsolationForest
from app.engine.data_store import data_store

class AnomalyDetector:
    @staticmethod
    def detect(
        table_name: str,
        feature_columns: Optional[List[str]] = None,
        method: str = "isolation_forest",
        contamination: float = 0.05,
        z_threshold: float = 3.0
    ) -> Dict[str, Any]:
        df = data_store.get_df(table_name)
        if df is None:
            raise ValueError(f"Table '{table_name}' does not exist.")

        # Identify numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            raise ValueError(f"Table '{table_name}' has no numerical columns for anomaly detection.")

        if feature_columns:
            chosen_cols = [c for c in feature_columns if c in numeric_cols]
            if not chosen_cols:
                chosen_cols = numeric_cols[:3]
        else:
            # Pick best default metrics (revenue, profit, amount, units, spend, etc.)
            priority = ["amount", "revenue", "profit", "profit_margin", "units_sold", "spend", "clicks", "discount"]
            chosen_cols = [c for c in priority if c in numeric_cols]
            if not chosen_cols:
                chosen_cols = numeric_cols[:2]

        clean_sub = df[chosen_cols].dropna()
        if len(clean_sub) < 10:
            raise ValueError("Not enough non-null numeric data to perform robust anomaly detection.")

        anomalies_info = []
        is_anomaly_mask = pd.Series(False, index=df.index)
        scores = pd.Series(0.0, index=df.index)

        primary_col = chosen_cols[0]

        if method == "isolation_forest":
            iso = IsolationForest(contamination=contamination, random_state=42)
            preds = iso.fit_predict(clean_sub)
            decision_scores = -iso.decision_function(clean_sub)
            
            is_anomaly_mask.loc[clean_sub.index] = (preds == -1)
            scores.loc[clean_sub.index] = decision_scores

        elif method == "z_score":
            z_scores = (clean_sub[chosen_cols] - clean_sub[chosen_cols].mean()) / clean_sub[chosen_cols].std().replace(0, 1)
            max_abs_z = z_scores.abs().max(axis=1)
            is_anomaly_mask.loc[clean_sub.index] = (max_abs_z > z_threshold)
            scores.loc[clean_sub.index] = max_abs_z

        else: # IQR method
            iqr_flags = pd.Series(False, index=clean_sub.index)
            for c in chosen_cols:
                q1 = clean_sub[c].quantile(0.25)
                q3 = clean_sub[c].quantile(0.75)
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                iqr_flags = iqr_flags | (clean_sub[c] < lower) | (clean_sub[c] > upper)
            is_anomaly_mask.loc[clean_sub.index] = iqr_flags
            scores.loc[clean_sub.index] = iqr_flags.astype(float)

        anomaly_indices = df[is_anomaly_mask].index.tolist()

        # Build explanations for each flagged record
        flagged_records = []
        for idx in anomaly_indices[:50]: # Top 50 flagged
            row = df.loc[idx].to_dict()
            explanations = []
            
            for col in chosen_cols:
                val = row[col]
                mean_val = clean_sub[col].mean()
                std_val = clean_sub[col].std()
                z = (val - mean_val) / std_val if std_val > 0 else 0
                
                if abs(z) >= 2.0:
                    direction = "above" if z > 0 else "below"
                    explanations.append(
                        f"Field '{col}' = {val:,.2f} is {abs(z):.1f} std deviations {direction} mean ({mean_val:,.2f})"
                    )

            if not explanations:
                explanations.append(f"Multi-dimensional outlier across {', '.join(chosen_cols)} (Isolation Forest Score: {scores.loc[idx]:.3f})")

            # Clean row values for JSON serialization
            clean_row = {k: (v if not pd.isna(v) else None) for k, v in row.items()}
            flagged_records.append({
                "row_index": int(idx),
                "data": clean_row,
                "anomaly_score": round(float(scores.loc[idx]), 3),
                "explanation": " | ".join(explanations)
            })

        # Chart scatter points (primary_col vs index or secondary col)
        sec_col = chosen_cols[1] if len(chosen_cols) > 1 else None
        scatter_points = []
        for i in range(min(len(df), 200)):
            is_anom = bool(is_anomaly_mask.iloc[i])
            x_val = df[sec_col].iloc[i] if sec_col else i
            y_val = df[primary_col].iloc[i]
            if not pd.isna(x_val) and not pd.isna(y_val):
                scatter_points.append({
                    "x": float(x_val) if isinstance(x_val, (int, float)) else str(x_val),
                    "y": round(float(y_val), 2),
                    "is_anomaly": is_anom,
                    "index": i
                })

        return {
            "table_name": table_name,
            "method": method,
            "feature_columns": chosen_cols,
            "total_rows": len(df),
            "anomaly_count": len(anomaly_indices),
            "anomaly_percentage": round((len(anomaly_indices) / len(df)) * 100, 2),
            "flagged_records": flagged_records,
            "scatter_data": scatter_points,
            "x_axis_label": sec_col or "Row Index",
            "y_axis_label": primary_col
        }

anomaly_detector = AnomalyDetector()
