from ..database.core import Base
from sqlalchemy.orm import relationship
from sqlalchemy import BigInteger, Column, ForeignKey

class Sentido(Base):
    __tablename__ = "sentidos"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    linea_id = Column(BigInteger, ForeignKey('lineas.id', ondelete='CASCADE'), nullable=False)
    estacion_id = Column(BigInteger, ForeignKey('estaciones.id', ondelete='CASCADE'), nullable=False)

    # Relaciones
    linea = relationship("Linea", back_populates="sentidos")
    estacion = relationship("Estacion", back_populates="sentidos")

    # Relación con recorridos al andén
    recorridos = relationship("RecorridoAlAnden", back_populates="direccion", cascade="all, delete-orphan")