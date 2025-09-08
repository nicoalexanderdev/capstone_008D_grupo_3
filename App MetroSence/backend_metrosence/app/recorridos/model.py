from pydantic import BaseModel
from typing import Optional

class RecorridoBase(BaseModel):
    estacion_id: int
    acceso_id: int
    direccion_id: int
    instrucciones: str

class RecorridoCreate(RecorridoBase):
    pass

class RecorridoUpdate(RecorridoBase):
    pass

class Recorrido(RecorridoBase):
    id: int

    class Config:
        from_attributes = True

# Modelo para respuesta con información relacionada
class RecorridoConRelaciones(Recorrido):
    estacion_nombre: Optional[str] = None
    acceso_letra: Optional[str] = None
    direccion_nombre: Optional[str] = None

# Modelo para solicitud de instrucciones
class SolicitudInstrucciones(BaseModel):
    estacion_id: int
    acceso_id: int
    direccion_id: int