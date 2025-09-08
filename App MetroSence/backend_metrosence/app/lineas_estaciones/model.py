# models.py
from pydantic import BaseModel

class EstacionLineaBase(BaseModel):
    estacion_id: int
    linea_id: int

class EstacionLineaCreate(EstacionLineaBase):
    pass

class EstacionLinea(EstacionLineaBase):
    class Config:
       from_attributes = True