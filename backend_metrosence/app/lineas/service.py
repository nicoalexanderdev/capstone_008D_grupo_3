from sqlalchemy.orm import Session
from app.entities.linea import Linea
from . import model
from fastapi import HTTPException, status

def get_lines(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Linea).offset(skip).limit(limit).all()

def get_line_by_id(db: Session, linea_id: int):
    return db.query(Linea).filter(Linea.id == linea_id).first()

def create_line(db: Session, linea: model.LineaCreate):
    db_linea = Linea(name=linea.name)
    db.add(db_linea)
    db.commit()
    db.refresh(db_linea)
    return db_linea

def update_line(db: Session, linea_id: int, linea: model.LineaUpdate):
    db_linea = db.query(Linea).filter(Linea.id == linea_id).first()
    if not db_linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    
    db_linea.name = linea.name
    db.commit()
    db.refresh(db_linea)
    return db_linea

def delete_line(db: Session, linea_id: int):
    db_linea = db.query(Linea).filter(Linea.id == linea_id).first()
    if not db_linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    
    db.delete(db_linea)
    db.commit()
    return {"message": "Línea eliminada correctamente"}