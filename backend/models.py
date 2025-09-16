from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    source_type = Column(String)
    config = Column(JSON)
    data_points = relationship("DataPoint", back_populates="source")

class DataPoint(Base):
    __tablename__ = "data_points"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    value = Column(Float)
    source_id = Column(Integer, ForeignKey("data_sources.id"))
    source = relationship("DataSource", back_populates="data_points")