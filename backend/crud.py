from sqlalchemy.orm import Session
from datetime import datetime

import models
import schemas

def get_data_source(db: Session, source_id: int):
    return db.query(models.DataSource).filter(models.DataSource.id == source_id).first()

def get_data_source_by_name(db: Session, name: str):
    return db.query(models.DataSource).filter(models.DataSource.name == name).first()

def get_data_sources(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.DataSource).offset(skip).limit(limit).all()

def create_data_source(db: Session, source: schemas.DataSourceCreate):
    db_source = models.DataSource(name=source.name, source_type=source.source_type, config=source.config)
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source

def get_data_points_by_source(db: Session, source_id: int):
    return db.query(models.DataPoint).filter(models.DataPoint.source_id == source_id).all()

def create_data_point(db: Session, data_point: schemas.DataPointCreate):
    db_data_point = models.DataPoint(source_id=data_point.source_id, value=data_point.value, timestamp=datetime.utcnow())
    db.add(db_data_point)
    db.commit()
    db.refresh(db_data_point)
    return db_data_point