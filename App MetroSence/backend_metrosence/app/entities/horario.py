from sqlalchemy import BigInteger, Time, ForeignKey, Column
from sqlalchemy.orm import relationship
from ..database.core import Base

class Horario(Base):
    __tablename__ = "horarios"

    estacion_id = Column(BigInteger, ForeignKey("estaciones.id", ondelete="CASCADE"), primary_key=True)
    open_weekdays = Column(Time, nullable=False)
    close_weekdays = Column(Time, nullable=False)
    open_saturdays = Column(Time, nullable=False)
    close_saturdays = Column(Time, nullable=False)
    open_holidays = Column(Time, nullable=False)
    close_holidays = Column(Time, nullable=False)

    # Relación con estación
    estacion = relationship("Estacion", back_populates="horario")


