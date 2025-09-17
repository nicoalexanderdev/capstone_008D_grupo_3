# models.py
from pydantic import BaseModel
from ..estaciones.model import EstacionBase
from ..lineas.model import LineaBase
from typing import Optional

class SentidoBase(BaseModel):
    linea_id: int
    estacion_id: int

class SentidoCreate(SentidoBase):
    pass

class SentidoUpdate(SentidoBase):
    pass

class Sentido(SentidoBase):
    id_sentido: int
    
    class Config:
       from_attributes = True

# Modelos con relaciones para respuestas
class SentidoWithRelations(Sentido):
    linea: Optional[LineaBase] = None
    estacion: Optional[EstacionBase] = None

# Modelo para respuesta de sentidos por línea
class SentidoPorLinea(Sentido):
    estacion: EstacionBase