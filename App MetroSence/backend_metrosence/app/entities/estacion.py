from sqlalchemy import BigInteger, Column, String
from sqlalchemy.orm import relationship
from ..entities.association import estaciones_lineas
from ..database.core import Base

class Estacion(Base):
    __tablename__ = "estaciones"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)

    # Relación con líneas
    lineas = relationship(
        "Linea", 
        secondary=estaciones_lineas, 
        back_populates="estaciones"
    )

    # Relación con sentidos
    sentidos = relationship("Sentido", back_populates="estacion")

    # Relación con accesos
    accesos = relationship("Acceso", back_populates="estacion", cascade="all, delete-orphan")

    # Relación con horario (uno a uno)
    horario = relationship("Horario", back_populates="estacion", uselist=False, cascade="all, delete-orphan")

    # Relación con recorridos al andén
    recorridos = relationship("RecorridoAlAnden", back_populates="estacion", cascade="all, delete-orphan")