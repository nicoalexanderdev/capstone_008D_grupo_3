from sqlalchemy.orm import Session
from app.entities.estacion import Estacion
from . import model
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

def get_estations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Estacion).offset(skip).limit(limit).all()

def get_estation_by_id(db: Session, estacion_id: int):
    return db.query(Estacion).filter(Estacion.id == estacion_id).first()

def create_estation(db: Session, estacion: model.EstacionCreate):
    db_estacion = Estacion(name=estacion.name)
    db.add(db_estacion)
    db.commit()
    db.refresh(db_estacion)
    return db_estacion

def update_estation(db: Session, estacion_id: int, estacion: model.EstacionUpdate):
    db_estacion = db.query(Estacion).filter(Estacion.id == estacion_id).first()
    if not db_estacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    
    db_estacion.name = estacion.name
    db.commit()
    db.refresh(db_estacion)
    return db_estacion

def delete_estation(db: Session, estacion_id: int):
    db_estacion = db.query(Estacion).filter(Estacion.id == estacion_id).first()
    if not db_estacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    
    db.delete(db_estacion)
    db.commit()
    return {"message": "Línea eliminada correctamente"}


def get_estacion_with_accesos(db: Session, estacion_id: int):
    return (
        db.query(Estacion)
        .options(joinedload(Estacion.accesos))
        .filter(Estacion.id == estacion_id)
        .first()
    )

def get_estaciones_with_accesos(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Estacion)
        .options(joinedload(Estacion.accesos))
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_estacion_with_horario(db: Session, estacion_id: int):
    return (
        db.query(Estacion)
        .options(joinedload(Estacion.horario))
        .filter(Estacion.id == estacion_id)
        .first()
    )

def get_estaciones_with_horario(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Estacion)
        .options(joinedload(Estacion.horario))
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_estacion_with_all(db: Session, estacion_id: int):
    return (
        db.query(Estacion)
        .options(
            joinedload(Estacion.accesos),
            joinedload(Estacion.horario),
            joinedload(Estacion.lineas)
        )
        .filter(Estacion.id == estacion_id)
        .first()
    )