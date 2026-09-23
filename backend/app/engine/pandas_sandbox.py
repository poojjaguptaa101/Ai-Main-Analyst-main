import ast
import io
import time
import sys
import numpy as np
import pandas as pd
from typing import Dict, Any
from app.engine.data_store import data_store

FORBIDDEN_MODULES = {"os", "sys", "subprocess", "shutil", "socket", "http", "requests", "pathlib", "importlib"}
FORBIDDEN_CALLS = {"eval", "exec", "compile", "open", "__import__", "globals", "locals"}

class SecurityVisitor(ast.NodeVisitor):
    def visit_Import(self, node):
        for alias in node.names:
            if alias.name.split('.')[0] in FORBIDDEN_MODULES:
                raise SecurityError(f"Import of module '{alias.name}' is prohibited in sandbox.")
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module and node.module.split('.')[0] in FORBIDDEN_MODULES:
            raise SecurityError(f"Import from module '{node.module}' is prohibited in sandbox.")
        self.generic_visit(node)

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
            raise SecurityError(f"Calling function '{node.func.id}' is prohibited in sandbox.")
        self.generic_visit(node)

class SecurityError(Exception):
    pass

class PandasSandbox:
    @staticmethod
    def execute(code: str) -> Dict[str, Any]:
        # 1. AST Safety check
        try:
            tree = ast.parse(code)
            SecurityVisitor().visit(tree)
        except SecurityError as se:
            return {"success": False, "error": str(se), "execution_time_ms": 0}
        except SyntaxError as syn:
            return {"success": False, "error": f"Syntax Error: {syn}", "execution_time_ms": 0}

        # 2. Setup safe globals
        safe_globals = {
            "pd": pd,
            "np": np,
            "tables": {tbl: df.copy() for tbl, df in data_store.dataframes.items()}
        }
        # Inject tables directly as variables if valid identifier
        for tbl, df in data_store.dataframes.items():
            safe_globals[tbl] = df.copy()

        local_vars = {}
        old_stdout = sys.stdout
        redirected_output = io.StringIO()
        sys.stdout = redirected_output

        start_time = time.perf_counter()
        try:
            exec(code, safe_globals, local_vars)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            sys.stdout = old_stdout
            stdout_text = redirected_output.getvalue()

            # Check for result variable
            result_obj = local_vars.get("result", None)
            formatted_result = None

            if isinstance(result_obj, pd.DataFrame):
                formatted_result = {
                    "type": "dataframe",
                    "columns": result_obj.columns.tolist(),
                    "rows": result_obj.replace({np.nan: None}).head(100).to_dict(orient="records"),
                    "total_rows": len(result_obj)
                }
            elif isinstance(result_obj, pd.Series):
                res_df = result_obj.reset_index()
                formatted_result = {
                    "type": "series",
                    "columns": res_df.columns.tolist(),
                    "rows": res_df.replace({np.nan: None}).to_dict(orient="records"),
                    "total_rows": len(res_df)
                }
            elif result_obj is not None:
                formatted_result = {
                    "type": "scalar",
                    "value": str(result_obj)
                }

            return {
                "success": True,
                "stdout": stdout_text,
                "result": formatted_result,
                "execution_time_ms": elapsed_ms
            }
        except Exception as e:
            sys.stdout = old_stdout
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": False,
                "error": str(e),
                "stdout": redirected_output.getvalue(),
                "execution_time_ms": elapsed_ms
            }

pandas_sandbox = PandasSandbox()
