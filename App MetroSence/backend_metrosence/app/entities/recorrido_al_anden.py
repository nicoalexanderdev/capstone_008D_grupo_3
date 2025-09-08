from sqlalchemy import BigInteger, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database.core import Base

class RecorridoAlAnden(Base):
    __tablename__ = "recorrido_al_anden"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    estacion_id = Column(BigInteger, ForeignKey('estaciones.id', ondelete="CASCADE"), nullable=False)
    acceso_id = Column(BigInteger, ForeignKey('accesos.id', ondelete='CASCADE'), nullable=False)
    direccion_id = Column(BigInteger, ForeignKey('sentidos.id', ondelete='CASCADE'), nullable=False)
    instrucciones = Column(String, nullable=False, unique=False)

    # Relaciones
    estacion = relationship("Estacion", back_populates="recorridos")
    acceso = relationship("Acceso", back_populates="recorridos")
    direccion = relationship("Sentido", back_populates="recorridos")
