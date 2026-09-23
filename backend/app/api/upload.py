import os
import glob
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Any
from app.engine.data_store import data_store

router = APIRouter(prefix="/api", tags=["Upload & Tables"])

@router.post("/upload")
async def upload_csv_files(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        if not file.filename.endswith(".csv"):
            continue
        content = await file.read()
        try:
            meta = data_store.register_csv_bytes(file.filename, content)
            results.append(meta)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process '{file.filename}': {str(e)}")
    
    if not results:
        raise HTTPException(status_code=400, detail="No valid CSV files uploaded.")
    return {"uploaded_tables": results, "total_loaded": len(results)}

@router.post("/load-samples")
def load_sample_datasets():
    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "sample_data"))
    if not os.path.exists(sample_dir):
        raise HTTPException(status_code=404, detail="Sample datasets directory not found.")
    
    loaded = []
    for file_path in glob.glob(os.path.join(sample_dir, "*.csv")):
        filename = os.path.basename(file_path)
        with open(file_path, "rb") as f:
            content = f.read()
        meta = data_store.register_csv_bytes(filename, content)
        loaded.append(meta)

    return {
        "message": f"Successfully loaded {len(loaded)} enterprise sample datasets.",
        "tables": loaded,
        "relationships": data_store.foreign_keys
    }

@router.get("/tables")
def get_tables():
    return {
        "tables": data_store.get_tables(),
        "metadata": data_store.get_all_metadata(),
        "foreign_keys": data_store.foreign_keys
    }

@router.get("/tables/{table_name}")
def get_table_details(table_name: str):
    meta = data_store.get_metadata(table_name)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found.")
    return meta

@router.delete("/tables")
def reset_tables():
    data_store.reset()
    return {"message": "All analytical tables reset successfully."}
