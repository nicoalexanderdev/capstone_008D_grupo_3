from pydantic import BaseModel
from datetime import time
from typing import Optional

class HorarioBase(BaseModel):
    estacion_id: int
    open_weekdays: time
    close_weekdays: time
    open_saturdays: time
    close_saturdays: time
    open_holidays: time
    close_holidays: time

class HorarioCreate(HorarioBase):
    pass

class HorarioUpdate(HorarioBase):
    pass

class Horario(HorarioBase):
    class Config:
        from_attributes = True

# Modelo para respuesta con información formateada
class HorarioFormateado(BaseModel):
    estacion_id: int
    lunes_a_viernes: str
    sabado: str
    domingo_festivos: str
    
    class Config:
        from_attributes = True