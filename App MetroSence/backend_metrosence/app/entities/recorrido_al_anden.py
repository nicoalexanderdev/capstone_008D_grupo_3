from sqlalchemy import BigInteger, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database.core import Base

class RecorridoAlAnden(Base):
    __tablename__ = "recorrido"

    id_recorrido = Column(BigInteger, primary_key=True, autoincrement=True)
    estacion_id = Column(BigInteger, ForeignKey('estacion.id_estacion', ondelete="CASCADE"), nullable=False)
    acceso_id = Column(BigInteger, ForeignKey('acceso.id_acceso', ondelete='CASCADE'), nullable=False)
    sentido_id = Column(BigInteger, ForeignKey('sentido.id_sentido', ondelete='CASCADE'), nullable=False)
    instrucciones = Column(String, nullable=False, unique=False)

    # Relaciones
    estacion = relationship("Estacion", back_populates="recorridos")
    acceso = relationship("Acceso", back_populates="recorridos")
    sentido = relationship("Sentido", back_populates="recorridos")