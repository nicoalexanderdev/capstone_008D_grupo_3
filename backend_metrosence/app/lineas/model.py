from pydantic import BaseModel
from typing import List, Optional

class LineaBase(BaseModel):
    name: str

class LineaCreate(LineaBase):
    pass

class LineaUpdate(LineaBase):
    pass

class Linea(LineaBase):
    id: int
    #estaciones: List[Estacion] = []
    #sentidos: List[Sentido] = []

    class Config:
        from_attributes = True