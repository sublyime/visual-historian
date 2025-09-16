from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class DataSourceBase(BaseModel):
    name: str
    source_type: str
    config: Optional[Dict[str, Any]] = {}

class DataSourceCreate(DataSourceBase):
    pass

class DataSource(DataSourceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DataPointBase(BaseModel):
    value: float
    source_id: int

class DataPointCreate(DataPointBase):
    pass

class DataPoint(DataPointBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)