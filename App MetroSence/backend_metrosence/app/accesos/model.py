from pydantic import BaseModel
from typing import Optional

class AccesoBase(BaseModel):
    estacion_id: int
    letra: str
    direccion: str

class AccesoCreate(AccesoBase):
    pass

class AccesoUpdate(AccesoBase):
    pass

class Acceso(AccesoBase):
    id_acceso: int

    class Config:
        from_attributes = True

# Modelo para respuesta con información de la estación
class AccesoWithEstacion(Acceso):
    estacion_nombre: Optional[str] = None