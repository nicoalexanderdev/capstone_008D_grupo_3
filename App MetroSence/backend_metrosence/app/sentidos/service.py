from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from . import model
from ..entities.sentido import Sentido as SentidoEntity
from ..entities.linea import Linea as LineaEntity
from ..entities.estacion import Estacion as EstacionEntity

def get_sentidos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(SentidoEntity).offset(skip).limit(limit).all()

def get_sentido(db: Session, sentido_id: int):
    return db.query(SentidoEntity).filter(SentidoEntity.id_sentido == sentido_id).first()

def get_sentidos_por_linea(db: Session, linea_id: int):
    # Verificar que la línea existe
    linea = db.query(LineaEntity).filter(LineaEntity.id_linea == linea_id).first()
    if not linea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Línea no encontrada")
    
    # Obtener los sentidos de la línea con información de la estación
    sentidos = (
        db.query(SentidoEntity)
        .options(joinedload(SentidoEntity.estacion))
        .filter(SentidoEntity.linea_id == linea_id)
        .all()
    )
    
    return sentidos

def create_sentido(db: Session, sentido: model.SentidoCreate):
    # Verificar que existan la línea y la estación
    linea = db.query(LineaEntity).filter(LineaEntity.id_linea == sentido.linea_id).first()
    if not linea:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Línea no encontrada")
    
    estacion = db.query(EstacionEntity).filter(EstacionEntity.id_estacion == sentido.estacion_id).first()
    if not estacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    
    # Verificar que la estación pertenece a la línea
    if estacion not in linea.estaciones:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="La estación no pertenece a esta línea"
        )
    
    # Verificar que no exista ya un sentido con el mismo nombre para esta línea
    # sentido_existente = (
    #     db.query(SentidoEntity)
    #     .filter(
    #         SentidoEntity.linea_id == sentido.linea_id
    #     )
    #     .first()
    # )
    
    # if sentido_existente:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST, 
    #         detail="Ya existe un sentido con este nombre para esta línea"
    #     )
    
    # Verificar que no haya más de 2 sentidos por línea
    sentidos_por_linea = db.query(SentidoEntity).filter(SentidoEntity.linea_id == sentido.linea_id).count()
    if sentidos_por_linea >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Una línea no puede tener más de 2 sentidos"
        )
    
    db_sentido = SentidoEntity(
        linea_id=sentido.linea_id,
        estacion_id=sentido.estacion_id
    )
    db.add(db_sentido)
    db.commit()
    db.refresh(db_sentido)
    return db_sentido


def update_sentido(db: Session, sentido_id: int, sentido: model.SentidoUpdate):
    db_sentido = db.query(SentidoEntity).filter(SentidoEntity.id == sentido_id).first()
    if not db_sentido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sentido no encontrado")
    
    # Verificar que existan la línea y la estación si se cambian
    if sentido.linea_id:
        linea = db.query(LineaEntity).filter(LineaEntity.id == sentido.linea_id).first()
        if not linea:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Línea no encontrada")
    
    if sentido.estacion_id:
        estacion = db.query(EstacionEntity).filter(EstacionEntity.id == sentido.estacion_id).first()
        if not estacion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
        
        # Verificar que la estación pertenece a la línea
        if estacion not in linea.estaciones:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="La estación no pertenece a esta línea"
            )
    
    # Verificar que no exista ya un sentido con el mismo nombre para esta línea
    if sentido.nombre != db_sentido.nombre:
        sentido_existente = (
            db.query(SentidoEntity)
            .filter(
                SentidoEntity.linea_id == sentido.linea_id,
                SentidoEntity.nombre == sentido.nombre,
                SentidoEntity.id != sentido_id
            )
            .first()
        )
        
        if sentido_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Ya existe un sentido con este nombre para esta línea"
            )
    
    db_sentido.linea_id = sentido.linea_id
    db_sentido.estacion_id = sentido.estacion_id
    db_sentido.nombre = sentido.nombre
    db.commit()
    db.refresh(db_sentido)
    return db_sentido

def delete_sentido(db: Session, sentido_id: int):
    db_sentido = db.query(SentidoEntity).filter(SentidoEntity.id == sentido_id).first()
    if not db_sentido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sentido no encontrado")
    db.delete(db_sentido)
    db.commit()
    return db_sentido