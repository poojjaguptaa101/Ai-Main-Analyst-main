from fastapi import APIRouter, HTTPException
from app.models.schemas import ForecastRequest
from app.engine.forecaster import forecaster

router = APIRouter(prefix="/api/forecast", tags=["Forecasting"])

@router.post("/predict")
def forecast_endpoint(req: ForecastRequest):
    try:
        return forecaster.forecast(
            table_name=req.table_name,
            date_column=req.date_column,
            value_column=req.value_column,
            aggregation=req.aggregation,
            horizon=req.horizon
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
