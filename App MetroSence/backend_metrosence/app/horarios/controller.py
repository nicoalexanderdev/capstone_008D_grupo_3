from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import model, service
from app.database.core import get_db
from ..auth.service import get_current_admin

router = APIRouter(prefix="/horarios", tags=["Horarios"])

@router.get("/", response_model=List[model.Horario])
def read_horarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    horarios = service.get_horarios(db, skip=skip, limit=limit)
    return horarios

@router.get("/formateados", response_model=List[model.HorarioFormateado])
def read_horarios_formateados(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    horarios = service.get_horarios_formateados(db, skip=skip, limit=limit)
    return horarios

# @router.get("/estacion/{estacion_id}", response_model=model.Horario)
# def read_horario(estacion_id: int, db: Session = Depends(get_db)):
#     db_horario = service.get_horario(db, estacion_id=estacion_id)
#     if db_horario is None:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")
#     return db_horario

@router.get("/{horario_id}/formateado", response_model=model.HorarioFormateado)
def read_horario_formateado(horario_id: int, db: Session = Depends(get_db)):
    db_horario = service.get_horario_formateado(db, horario_id=horario_id)
    if db_horario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")
    return db_horario

@router.post("/", response_model=model.Horario, status_code=status.HTTP_201_CREATED)
def create_horario(horario: model.HorarioCreate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    return service.create_horario(db=db, horario=horario)

@router.put("/{horario_id}", response_model=model.Horario)
def update_horario(horario_id: int, horario: model.HorarioUpdate, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    db_horario = service.update_horario(db, horario_id=horario_id, horario=horario)
    if db_horario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")
    return db_horario

@router.delete("/{horario_id}", response_model=model.Horario)
def delete_horario(horario_id: int, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    db_horario = service.delete_horario(db, horario_id=horario_id)
    if db_horario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")
    return db_horario