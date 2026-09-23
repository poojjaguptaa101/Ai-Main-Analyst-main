from fastapi import APIRouter, HTTPException
from app.models.schemas import AnomalyDetectRequest
from app.engine.anomaly_detector import anomaly_detector

router = APIRouter(prefix="/api/anomalies", tags=["Anomaly Detection"])

@router.post("/detect")
def detect_anomalies_endpoint(req: AnomalyDetectRequest):
    try:
        return anomaly_detector.detect(
            table_name=req.table_name,
            feature_columns=req.feature_columns,
            method=req.method,
            contamination=req.contamination,
            z_threshold=req.z_threshold
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
