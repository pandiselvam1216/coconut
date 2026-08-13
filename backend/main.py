from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import models
import database
from database import engine
from datetime import datetime, timedelta
import os
import sys
import base64
from io import BytesIO
from PIL import Image
from ultralytics import YOLO
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "run", "weights", "best.pt")
print(f"Loading YOLO model from {MODEL_PATH}...")
try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(f"FATAL ERROR: Failed to load YOLO model: {e}")
    sys.exit(1)


models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CountCreate(BaseModel):
    count: int

@app.post("/api/counts")
def log_count(count_data: CountCreate, db: Session = Depends(get_db)):
    db_log = models.DetectionLog(count=count_data.count)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    
    # Last 24 hours (grouped by hour)
    last_24h = now - timedelta(hours=24)
    hourly_counts = db.query(
        func.strftime('%H:00', models.DetectionLog.timestamp).label('hour'),
        func.sum(models.DetectionLog.count).label('total_count')
    ).filter(models.DetectionLog.timestamp >= last_24h)\
     .group_by('hour').all()

    # Last 7 days (grouped by day)
    last_7d = now - timedelta(days=7)
    daily_counts = db.query(
        func.date(models.DetectionLog.timestamp).label('day'),
        func.sum(models.DetectionLog.count).label('total_count')
    ).filter(models.DetectionLog.timestamp >= last_7d)\
     .group_by('day').all()

    return {
        "hourly": [{"name": str(hour), "count": count} for hour, count in hourly_counts],
        "daily": [{"name": str(day), "count": count} for day, count in daily_counts]
    }

class InferenceRequest(BaseModel):
    inputs: dict

@app.post("/api/infer")
def proxy_inference(request: InferenceRequest):
    try:
        base64_data = request.inputs.get('image', {}).get('value')
        if not base64_data:
            raise HTTPException(status_code=400, detail="No image provided")
            
        image_data = base64.b64decode(base64_data)
        image = Image.open(BytesIO(image_data))
        
        results = model(image)
        predictions = []
        for box in results[0].boxes:
            predictions.append({
                "class": model.names[int(box.cls)],
                "confidence": float(box.conf),
                "x": float(box.xywhn[0][0]),
                "y": float(box.xywhn[0][1]),
                "width": float(box.xywhn[0][2]),
                "height": float(box.xywhn[0][3])
            })
            
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/diagnostics")
def get_diagnostics():
    return {
        "api_key_set": True,
        "model_loaded": True,
        "model_path": MODEL_PATH,
        "classes": model.names,
        "backend": "local_yolo"
    }
