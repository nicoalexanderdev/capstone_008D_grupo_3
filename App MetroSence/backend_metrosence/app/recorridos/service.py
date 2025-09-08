from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from . import model
from ..entities.recorrido_al_anden import RecorridoAlAnden as RecorridoEntity
from ..entities.estacion import Estacion as EstacionEntity
from ..entities.acceso import Acceso as AccesoEntity
from ..entities.sentido import Sentido as SentidoEntity

def get_recorridos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RecorridoEntity).offset(skip).limit(limit).all()

def get_recorrido(db: Session, recorrido_id: int):
    return db.query(RecorridoEntity).filter(RecorridoEntity.id == recorrido_id).first()

def get_recorrido_por_parametros(db: Session, estacion_id: int, acceso_id: int, direccion_id: int):
    return (
        db.query(RecorridoEntity)
        .filter(
            RecorridoEntity.estacion_id == estacion_id,
            RecorridoEntity.acceso_id == acceso_id,
            RecorridoEntity.direccion_id == direccion_id
        )
        .first()
    )

def get_recorridos_con_relaciones(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(RecorridoEntity)
        .options(
            joinedload(RecorridoEntity.estacion),
            joinedload(RecorridoEntity.acceso),
            joinedload(RecorridoEntity.direccion)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_recorrido(db: Session, recorrido: model.RecorridoCreate):
    # Verificar que la estación existe
    estacion = db.query(EstacionEntity).filter(EstacionEntity.id == recorrido.estacion_id).first()
    if not estacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    
    # Verificar que el acceso existe
    acceso = db.query(AccesoEntity).filter(AccesoEntity.id == recorrido.acceso_id).first()
    if not acceso:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
    
    # Verificar que el acceso pertenece a la estación
    if acceso.estacion_id != recorrido.estacion_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El acceso no pertenece a esta estación"
        )
    
    # Verificar que la dirección existe
    direccion = db.query(SentidoEntity).filter(SentidoEntity.id == recorrido.direccion_id).first()
    if not direccion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dirección no encontrada")
    
    # Verificar que la dirección pertenece a la línea de la estación
    # (esto requiere verificar que la estación pertenece a la línea de la dirección)
    if recorrido.estacion_id not in [e.id for e in direccion.linea.estaciones]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="La dirección no corresponde a esta estación"
        )
    
    # Verificar que no existe ya un recorrido con estos parámetros
    recorrido_existente = get_recorrido_por_parametros(
        db, 
        recorrido.estacion_id, 
        recorrido.acceso_id, 
        recorrido.direccion_id
    )
    
    if recorrido_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Ya existe un recorrido con estos parámetros"
        )
    
    db_recorrido = RecorridoEntity(
        estacion_id=recorrido.estacion_id,
        acceso_id=recorrido.acceso_id,
        direccion_id=recorrido.direccion_id,
        instrucciones=recorrido.instrucciones
    )
    db.add(db_recorrido)
    db.commit()
    db.refresh(db_recorrido)
    return db_recorrido

def update_recorrido(db: Session, recorrido_id: int, recorrido: model.RecorridoUpdate):
    db_recorrido = db.query(RecorridoEntity).filter(RecorridoEntity.id == recorrido_id).first()
    if not db_recorrido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recorrido no encontrado")
    
    # Verificar que la estación existe si se cambia
    if recorrido.estacion_id != db_recorrido.estacion_id:
        estacion = db.query(EstacionEntity).filter(EstacionEntity.id == recorrido.estacion_id).first()
        if not estacion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    
    # Verificar que el acceso existe si se cambia
    if recorrido.acceso_id != db_recorrido.acceso_id:
        acceso = db.query(AccesoEntity).filter(AccesoEntity.id == recorrido.acceso_id).first()
        if not acceso:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Acceso no encontrado")
        
        # Verificar que el acceso pertenece a la estación
        if acceso.estacion_id != recorrido.estacion_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="El acceso no pertenece a esta estación"
            )
    
    # Verificar que la dirección existe si se cambia
    if recorrido.direccion_id != db_recorrido.direccion_id:
        direccion = db.query(SentidoEntity).filter(SentidoEntity.id == recorrido.direccion_id).first()
        if not direccion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dirección no encontrada")
        
        # Verificar que la dirección pertenece a la línea de la estación
        if recorrido.estacion_id not in [e.id for e in direccion.linea.estaciones]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="La dirección no corresponde a esta estación"
            )
    
    # Verificar que no existe ya otro recorrido con estos parámetros
    if (recorrido.estacion_id != db_recorrido.estacion_id or 
        recorrido.acceso_id != db_recorrido.acceso_id or 
        recorrido.direccion_id != db_recorrido.direccion_id):
        
        recorrido_existente = get_recorrido_por_parametros(
            db, 
            recorrido.estacion_id, 
            recorrido.acceso_id, 
            recorrido.direccion_id
        )
        
        if recorrido_existente and recorrido_existente.id != recorrido_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Ya existe un recorrido con estos parámetros"
            )
    
    db_recorrido.estacion_id = recorrido.estacion_id
    db_recorrido.acceso_id = recorrido.acceso_id
    db_recorrido.direccion_id = recorrido.direccion_id
    db_recorrido.instrucciones = recorrido.instrucciones
    db.commit()
    db.refresh(db_recorrido)
    return db_recorrido

def delete_recorrido(db: Session, recorrido_id: int):
    db_recorrido = db.query(RecorridoEntity).filter(RecorridoEntity.id == recorrido_id).first()
    if not db_recorrido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recorrido no encontrado")
    db.delete(db_recorrido)
    db.commit()
    return db_recorrido

def obtener_instrucciones(db: Session, solicitud: model.SolicitudInstrucciones):
    recorrido = get_recorrido_por_parametros(
        db, 
        solicitud.estacion_id, 
        solicitud.acceso_id, 
        solicitud.direccion_id
    )
    
    if not recorrido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron instrucciones para estos parámetros"
        )
    
    return recorrido