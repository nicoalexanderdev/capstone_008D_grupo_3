from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from . import model
from ..entities.acceso import Acceso as AccesoEntity
from ..entities.estacion import Estacion as EstacionEntity

def get_accesos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AccesoEntity).offset(skip).limit(limit).all()

def get_acceso(db: Session, acceso_id: int):
    return db.query(AccesoEntity).filter(AccesoEntity.id == acceso_id).first()

def get_accesos_por_estacion(db: Session, estacion_id: int):
    # Verificar que la estación existe
    estacion = db.query(EstacionEntity).filter(EstacionEntity.id == estacion_id).first()
    if not estacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    
    # Obtener los accesos de la estación
    accesos = db.query(AccesoEntity).filter(AccesoEntity.estacion_id == estacion_id).all()
    return accesos

def create_acceso(db: Session, acceso: model.AccesoCreate):
    # Verificar que la estación existe
    estacion = db.query(EstacionEntity).filter(EstacionEntity.id == acceso.estacion_id).first()
    if not estacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    
    # Verificar que no exista ya un acceso con la misma letra para esta estación
    acceso_existente = (
        db.query(AccesoEntity)
        .filter(
            AccesoEntity.estacion_id == acceso.estacion_id,
            AccesoEntity.letra == acceso.letra
        )
        .first()
    )
    
    if acceso_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Ya existe un acceso con esta letra para esta estación"
        )
    
    db_acceso = AccesoEntity(
        estacion_id=acceso.estacion_id,
        letra=acceso.letra,
        direccion=acceso.direccion
    )
    db.add(db_acceso)
    db.commit()
    db.refresh(db_acceso)
    return db_acceso

def update_acceso(db: Session, acceso_id: int, acceso: model.AccesoUpdate):
    db_acceso = db.query(AccesoEntity).filter(AccesoEntity.id == acceso_id).first()
    if not db_acceso:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
    
    # Verificar que la estación existe si se cambia
    if acceso.estacion_id != db_acceso.estacion_id:
        estacion = db.query(EstacionEntity).filter(EstacionEntity.id == acceso.estacion_id).first()
        if not estacion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    
    # Verificar que no exista ya un acceso con la misma letra para esta estación
    if acceso.estacion_id != db_acceso.estacion_id or acceso.letra != db_acceso.letra:
        acceso_existente = (
            db.query(AccesoEntity)
            .filter(
                AccesoEntity.estacion_id == acceso.estacion_id,
                AccesoEntity.letra == acceso.letra,
                AccesoEntity.id != acceso_id
            )
            .first()
        )
        
        if acceso_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Ya existe un acceso con esta letra para esta estación"
            )
    
    db_acceso.estacion_id = acceso.estacion_id
    db_acceso.letra = acceso.letra
    db_acceso.direccion = acceso.direccion
    db.commit()
    db.refresh(db_acceso)
    return db_acceso

def delete_acceso(db: Session, acceso_id: int):
    db_acceso = db.query(AccesoEntity).filter(AccesoEntity.id == acceso_id).first()
    if not db_acceso:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
    db.delete(db_acceso)
    db.commit()
    return db_acceso

def get_acceso_with_estacion(db: Session, acceso_id: int):
    return (
        db.query(AccesoEntity)
        .options(joinedload(AccesoEntity.estacion))
        .filter(AccesoEntity.id == acceso_id)
        .first()
    )

def get_accesos_with_estacion(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(AccesoEntity)
        .options(joinedload(AccesoEntity.estacion))
        .offset(skip)
        .limit(limit)
        .all()
    )