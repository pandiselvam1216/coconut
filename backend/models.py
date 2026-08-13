from sqlalchemy import Column, Integer, DateTime
from database import Base
import datetime

class DetectionLog(Base):
    __tablename__ = "detection_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    count = Column(Integer)
