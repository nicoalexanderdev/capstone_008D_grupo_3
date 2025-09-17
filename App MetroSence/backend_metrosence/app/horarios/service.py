from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from . import model
from ..entities.horario import Horario as HorarioEntity
from ..entities.estacion import Estacion as EstacionEntity

def get_horario(db: Session, horario_id: int):
    return db.query(HorarioEntity).filter(HorarioEntity.id_horario == horario_id).first()

def get_horarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(HorarioEntity).offset(skip).limit(limit).all()

def create_horario(db: Session, horario: model.HorarioCreate):
    db_horario = HorarioEntity(
        open_weekdays=horario.open_weekdays,
        close_weekdays=horario.close_weekdays,
        open_saturdays=horario.open_saturdays,
        close_saturdays=horario.close_saturdays,
        open_holidays=horario.open_holidays,
        close_holidays=horario.close_holidays
    )
    db.add(db_horario)
    db.commit()
    db.refresh(db_horario)
    return db_horario

def update_horario(db: Session, horario_id: int, horario: model.HorarioUpdate):
    db_horario = db.query(HorarioEntity).filter(HorarioEntity.id_horario == horario_id).first()
    if not db_horario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")
    
    # Actualizar campos
    if horario.open_weekdays is not None:
        db_horario.open_weekdays = horario.open_weekdays
    if horario.close_weekdays is not None:
        db_horario.close_weekdays = horario.close_weekdays
    if horario.open_saturdays is not None:
        db_horario.open_saturdays = horario.open_saturdays
    if horario.close_saturdays is not None:
        db_horario.close_saturdays = horario.close_saturdays
    if horario.open_holidays is not None:
        db_horario.open_holidays = horario.open_holidays
    if horario.close_holidays is not None:
        db_horario.close_holidays = horario.close_holidays
    
    db.commit()
    db.refresh(db_horario)
    return db_horario

def delete_horario(db: Session, horario_id: int):
    db_horario = db.query(HorarioEntity).filter(HorarioEntity.id_horario == horario_id).first()
    if not db_horario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")
    db.delete(db_horario)
    db.commit()
    return db_horario

def format_time(time_obj):
    """Formatea un objeto time a string HH:MM"""
    return time_obj.strftime("%H:%M")

def get_horario_formateado(db: Session, horario_id: int):
    horario = db.query(HorarioEntity).filter(HorarioEntity.id_horario == horario_id).first()
    if not horario:
        return None
    
    return {
        "id": horario.id_horario,
        "lunes_a_viernes": f"{format_time(horario.open_weekdays)} - {format_time(horario.close_weekdays)}",
        "sabado": f"{format_time(horario.open_saturdays)} - {format_time(horario.close_saturdays)}",
        "domingo_festivos": f"{format_time(horario.open_holidays)} - {format_time(horario.close_holidays)}"
    }

def get_horarios_formateados(db: Session, skip: int = 0, limit: int = 100):
    horarios = db.query(HorarioEntity).offset(skip).limit(limit).all()
    result = []
    
    for horario in horarios:
        result.append({
            "id": horario.id_horario,
            "lunes_a_viernes": f"{format_time(horario.open_weekdays)} - {format_time(horario.close_weekdays)}",
            "sabado": f"{format_time(horario.open_saturdays)} - {format_time(horario.close_saturdays)}",
            "domingo_festivos": f"{format_time(horario.open_holidays)} - {format_time(horario.close_holidays)}"
        })
    
    return result