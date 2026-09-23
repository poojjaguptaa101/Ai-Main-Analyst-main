import os
import io
import re
import duckdb
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple

class DataStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataStore, cls).__new__(cls)
            cls._instance._init_db()
        return cls._instance

    def _init_db(self):
        self.conn = duckdb.connect(database=":memory:")
        self.dataframes: Dict[str, pd.DataFrame] = {}
        self.table_metadata: Dict[str, Dict[str, Any]] = {}
        self.foreign_keys: List[Dict[str, str]] = []

    def clean_name(self, name: str) -> str:
        clean = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower().strip())
        clean = re.sub(r'_+', '_', clean).strip('_')
        if clean and clean[0].isdigit():
            clean = f"t_{clean}"
        return clean or "table_1"

    def register_dataframe(self, table_name: str, df: pd.DataFrame) -> Dict[str, Any]:
        clean_tbl = self.clean_name(table_name)
        
        # Clean column names
        cleaned_cols = {}
        for col in df.columns:
            cleaned_cols[col] = self.clean_name(str(col))
        df = df.rename(columns=cleaned_cols)

        # Store in duckdb
        self.conn.register(clean_tbl, df)
        self.dataframes[clean_tbl] = df

        # Generate metadata
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        summary = {}
        if numeric_cols:
            stats_df = df[numeric_cols].describe().to_dict()
            summary = {k: {stat: round(val, 2) if isinstance(val, (int, float)) and not np.isnan(val) else None 
                           for stat, val in v.items()} for k, v in stats_df.items()}

        preview = df.head(10).replace({np.nan: None}).to_dict(orient="records")

        meta = {
            "table_name": clean_tbl,
            "original_name": table_name,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": df.columns.tolist(),
            "column_types": dtypes,
            "numeric_columns": numeric_cols,
            "preview": preview,
            "summary_stats": summary
        }
        self.table_metadata[clean_tbl] = meta
        self._detect_relationships()
        return meta

    def register_csv_bytes(self, filename: str, content: bytes) -> Dict[str, Any]:
        # Try multiple encodings
        for enc in ['utf-8', 'latin-1', 'cp1252']:
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=enc)
                base_name = os.path.splitext(filename)[0]
                return self.register_dataframe(base_name, df)
            except Exception:
                continue
        raise ValueError(f"Could not parse CSV file '{filename}' with supported encodings.")

    def _detect_relationships(self):
        self.foreign_keys = []
        tables = list(self.table_metadata.keys())
        for i in range(len(tables)):
            for j in range(i + 1, len(tables)):
                t1, t2 = tables[i], tables[j]
                cols1 = set(self.table_metadata[t1]["columns"])
                cols2 = set(self.table_metadata[t2]["columns"])
                common = cols1.intersection(cols2)
                for col in common:
                    if col.endswith("_id") or col.endswith("id") or col in ["id", "code"]:
                        self.foreign_keys.append({
                            "from_table": t1,
                            "to_table": t2,
                            "column": col
                        })

    def get_tables(self) -> List[str]:
        return list(self.table_metadata.keys())

    def get_metadata(self, table_name: str) -> Optional[Dict[str, Any]]:
        return self.table_metadata.get(table_name)

    def get_all_metadata(self) -> Dict[str, Dict[str, Any]]:
        return self.table_metadata

    def get_df(self, table_name: str) -> Optional[pd.DataFrame]:
        return self.dataframes.get(table_name)

    def get_schema_summary_prompt(self) -> str:
        if not self.table_metadata:
            return "No tables currently loaded."
        
        prompt_parts = []
        for tbl, meta in self.table_metadata.items():
            cols_desc = ", ".join([f"{col} ({meta['column_types'].get(col, 'text')})" for col in meta['columns']])
            prompt_parts.append(f"Table '{tbl}' ({meta['row_count']} rows):\n  Columns: {cols_desc}")
        
        if self.foreign_keys:
            prompt_parts.append("\nDetected Table Relationships (Foreign Keys):")
            for fk in self.foreign_keys:
                prompt_parts.append(f"  - {fk['from_table']}.{fk['column']} = {fk['to_table']}.{fk['column']}")
        return "\n".join(prompt_parts)

    def reset(self):
        self._init_db()

data_store = DataStore()
