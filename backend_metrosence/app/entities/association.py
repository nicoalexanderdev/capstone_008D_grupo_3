from sqlalchemy import Table, Column, BigInteger, ForeignKey
from ..database.core import Base

estaciones_lineas = Table(
    "estaciones_lineas",
    Base.metadata,
    Column("estacion_id", BigInteger, ForeignKey("estaciones.id", ondelete="CASCADE"), primary_key=True),
    Column("linea_id",    BigInteger, ForeignKey("lineas.id",    ondelete="CASCADE"), primary_key=True),
)