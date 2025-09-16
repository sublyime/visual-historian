from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class DataSourceBase(BaseModel):
    name: str
    source_type: str
    config: Optional[dict] = {}

class DataSourceCreate(DataSourceBase):
    pass

class DataSource(DataSourceBase):
    id: int

    class Config:
        orm_mode = True

class DataPointBase(BaseModel):
    value: float
    source_id: int

class DataPointCreate(DataPointBase):
    pass

class DataPoint(DataPointBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True