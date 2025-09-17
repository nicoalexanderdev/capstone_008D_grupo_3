from pydantic import BaseModel
from datetime import time
from typing import Optional

class HorarioBase(BaseModel):
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
    id_horario: int
    class Config:
        from_attributes = True

# Modelo para respuesta con información formateada
class HorarioFormateado(BaseModel):
    lunes_a_viernes: str
    sabado: str
    domingo_festivos: str
    
    class Config:
        from_attributes = True