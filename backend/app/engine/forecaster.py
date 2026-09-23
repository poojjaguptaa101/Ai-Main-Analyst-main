import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime
from app.engine.data_store import data_store

class Forecaster:
    @staticmethod
    def forecast(
        table_name: str,
        date_column: str,
        value_column: str,
        aggregation: str = "month",
        horizon: int = 6
    ) -> Dict[str, Any]:
        df = data_store.get_df(table_name)
        if df is None:
            raise ValueError(f"Table '{table_name}' does not exist.")

        if date_column not in df.columns or value_column not in df.columns:
            raise ValueError(f"Specified columns '{date_column}' or '{value_column}' not found.")

        # Parse date and clean values
        temp_df = df[[date_column, value_column]].dropna().copy()
        temp_df[date_column] = pd.to_datetime(temp_df[date_column], errors='coerce')
        temp_df = temp_df.dropna().sort_values(date_column)

        if len(temp_df) < 5:
            raise ValueError("Insufficient time-series data points to generate forecast.")

        # Aggregate by frequency
        freq_map = {"day": "D", "week": "W", "month": "MS"}
        pandas_freq = freq_map.get(aggregation, "MS")
        
        ts = temp_df.set_index(date_column)[value_column].resample(pandas_freq).sum()
        ts = ts.ffill().fillna(0)

        if len(ts) < 3:
            raise ValueError("Aggregated time-series has fewer than 3 historical periods.")

        y = ts.values
        n = len(y)
        x = np.arange(n)

        # Fit linear + exponential trend
        poly = np.polyfit(x, y, 1)
        slope, intercept = poly[0], poly[1]

        # Calculate standard error of residuals
        residuals = y - (slope * x + intercept)
        std_error = np.std(residuals) if len(residuals) > 1 else np.mean(y) * 0.1

        # Exponential smoothing baseline
        alpha = 0.4
        smoothed = [y[0]]
        for val in y[1:]:
            smoothed.append(alpha * val + (1 - alpha) * smoothed[-1])

        # Generate future periods
        last_date = ts.index[-1]
        future_dates = pd.date_range(start=last_date, periods=horizon + 1, freq=pandas_freq)[1:]

        historical_points = []
        for dt, val in ts.items():
            historical_points.append({
                "date": dt.strftime("%Y-%m-%d"),
                "actual": round(float(val), 2),
                "trend": round(float(slope * ts.index.get_loc(dt) + intercept), 2)
            })

        forecast_points = []
        last_smooth = smoothed[-1]
        growth_rate = (y[-1] - y[0]) / max(len(y), 1)

        for i, f_date in enumerate(future_dates):
            t_future = n + i
            projected = max(0.0, float(last_smooth + (i + 1) * growth_rate))
            uncertainty_band = 1.96 * std_error * np.sqrt(1 + (i + 1) * 0.15)
            
            upper_bound = round(projected + uncertainty_band, 2)
            lower_bound = round(max(0.0, projected - uncertainty_band), 2)

            forecast_points.append({
                "date": f_date.strftime("%Y-%m-%d"),
                "forecast": round(projected, 2),
                "upper_bound": upper_bound,
                "lower_bound": lower_bound
            })

        # Summary statistics
        growth_pct = round(((forecast_points[-1]["forecast"] - y[-1]) / y[-1] * 100), 2) if y[-1] > 0 else 0.0

        return {
            "table_name": table_name,
            "metric": value_column,
            "date_column": date_column,
            "aggregation": aggregation,
            "horizon_periods": horizon,
            "historical_points": historical_points,
            "forecast_points": forecast_points,
            "trend_direction": "Upward" if slope > 0 else "Downward",
            "projected_growth_pct": growth_pct,
            "summary_insight": f"Based on historical velocity, '{value_column}' is trending {('upwards by ' + str(growth_pct) + '%') if growth_pct >= 0 else ('downwards by ' + str(abs(growth_pct)) + '%')} over the next {horizon} {aggregation}s."
        }

forecaster = Forecaster()
