from sqlalchemy import Time, Column, Integer
from sqlalchemy.orm import relationship
from ..database.core import Base

class Horario(Base):
    __tablename__ = "horario"

    id_horario = Column(Integer, primary_key=True, autoincrement=True)
    open_weekdays = Column(Time, nullable=False)
    close_weekdays = Column(Time, nullable=False)
    open_saturdays = Column(Time, nullable=False)
    close_saturdays = Column(Time, nullable=False)
    open_holidays = Column(Time, nullable=False)
    close_holidays = Column(Time, nullable=False)

    estaciones = relationship("Estacion", back_populates="horario")


