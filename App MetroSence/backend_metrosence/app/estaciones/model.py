from pydantic import BaseModel
from typing import List, Optional
from ..accesos.model import Acceso
from ..horarios.model import Horario

class EstacionBase(BaseModel):
    name: str

class EstacionCreate(EstacionBase):
    pass

class EstacionUpdate(EstacionBase):
    pass

class EstacionSimpleResponse(EstacionBase):
    id: int

class Estacion(EstacionBase):
    id: int
    accesos: Optional[List[Acceso]] = []
    horario: Optional[Horario] = None

    class Config:
        from_attributes = True

# Modelo para relaciones (sin importar Linea)
class EstacionWithLineas(Estacion):
    lineas: List["LineaBase"] = []  # Usamos string type annotation

# Necesitamos definir LineaBase aquí para evitar importación circular
class LineaBase(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True