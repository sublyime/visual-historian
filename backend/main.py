from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

import crud, models, schemas
from database import SessionLocal, engine

# This line ensures the new table is created in your database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Visual Historian API")

# Add the CORS middleware configuration
origins = [
    "http://localhost",
    "http://localhost:5173", # Allow your frontend's origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/datasources/", response_model=schemas.DataSource)
def create_data_source(source: schemas.DataSourceCreate, db: Session = Depends(get_db)):
    db_source = crud.get_data_source_by_name(db, name=source.name)
    if db_source:
        raise HTTPException(status_code=400, detail="Data source with this name already exists")
    return crud.create_data_source(db=db, source=source)

@app.get("/datasources/", response_model=List[schemas.DataSource])
def read_data_sources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sources = crud.get_data_sources(db, skip=skip, limit=limit)
    return sources

@app.post("/datapoints/", response_model=schemas.DataPoint)
def create_data_point(data_point: schemas.DataPointCreate, db: Session = Depends(get_db)):
    # Check if the source_id exists
    source = crud.get_data_source(db, source_id=data_point.source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    return crud.create_data_point(db=db, data_point=data_point)

@app.get("/datasources/{source_id}/datapoints/", response_model=List[schemas.DataPoint])
def read_data_points_by_source(source_id: int, db: Session = Depends(get_db)):
    data_points = crud.get_data_points_by_source(db, source_id=source_id)
    return data_points