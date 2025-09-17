from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from . import model
from ..entities.association import estaciones_lineas
from ..entities.estacion import Estacion
from ..entities.linea import Linea

def agregar_estacion_a_linea(db: Session, relacion: model.EstacionLineaCreate):
    # Verificar si la relación ya existe - CORREGIDO: usar estaciones_lineas directamente
    existing = (
        db.query(estaciones_lineas)
        .filter(
            estaciones_lineas.c.estacion_id == relacion.estacion_id,
            estaciones_lineas.c.linea_id == relacion.linea_id
        )
        .first()
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta relación ya existe"
        )
    
    # Verificar que existen tanto la estación como la línea
    estacion = db.query(Estacion).filter(Estacion.id_estacion == relacion.estacion_id).first()
    linea = db.query(Linea).filter(Linea.id_linea == relacion.linea_id).first()
    
    if not estacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estación con ID {relacion.estacion_id} no encontrada"
        )
    
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Línea con ID {relacion.linea_id} no encontrada"
        )
    
    try:
        # Insertar la relación
        stmt = estaciones_lineas.insert().values(
            estacion_id=relacion.estacion_id,
            linea_id=relacion.linea_id
        )
        db.execute(stmt)
        db.commit()
        
        return relacion
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear la relación"
        )

def eliminar_estacion_de_linea(db: Session, relacion: model.EstacionLineaCreate):
    # Verificar si la relación existe
    existing = (
        db.query(estaciones_lineas)
        .filter(
            estaciones_lineas.c.estacion_id == relacion.estacion_id,
            estaciones_lineas.c.linea_id == relacion.linea_id
        )
        .first()
    )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relación no encontrada"
        )
    
    # Eliminar la relación
    stmt = estaciones_lineas.delete().where(
        estaciones_lineas.c.estacion_id == relacion.estacion_id,
        estaciones_lineas.c.linea_id == relacion.linea_id
    )
    db.execute(stmt)
    db.commit()

def obtener_estaciones_por_linea(db: Session, linea_id: int):
    # Verificar que la línea existe
    linea = db.query(Linea).filter(Linea.id_linea == linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Línea con ID {linea_id} no encontrada"
        )
    
    # Obtener las estaciones de la línea
    estaciones = (
        db.query(Estacion.id_estacion, Estacion.name)
        .join(estaciones_lineas, Estacion.id_estacion == estaciones_lineas.c.estacion_id)
        .filter(estaciones_lineas.c.linea_id == linea_id)
        .all()
    )
    
    return estaciones

def obtener_lineas_por_estacion(db: Session, estacion_id: int):
    # Verificar que la estación existe
    estacion = db.query(Estacion).filter(Estacion.id_estacion == estacion_id).first()
    if not estacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estación con ID {estacion_id} no encontrada"
        )
    
    # Obtener las líneas de la estación
    lineas = (
        db.query(Linea)
        .join(estaciones_lineas, Linea.id_linea == estaciones_lineas.c.linea_id)
        .filter(estaciones_lineas.c.estacion_id == estacion_id)
        .all()
    )
    
    return lineas