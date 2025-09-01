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

    class Config:
        from_attributes = True

# Modelo para relaciones (sin importar Estacion)
class LineaWithEstaciones(Linea):
    estaciones: List["EstacionBase"] = []  # Usamos string type annotation

# Necesitamos definir EstacionBase aquí para evitar importación circular
class EstacionBase(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True