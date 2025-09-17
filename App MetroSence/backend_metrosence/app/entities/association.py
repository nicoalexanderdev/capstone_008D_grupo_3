from sqlalchemy import Table, Column, BigInteger, ForeignKey
from ..database.core import Base

estaciones_lineas = Table(
    "estaciones_lineas",
    Base.metadata,
    Column("estacion_id", BigInteger, ForeignKey("estacion.id_estacion", ondelete="CASCADE"), primary_key=True),
    Column("linea_id",    BigInteger, ForeignKey("linea.id_linea",    ondelete="CASCADE"), primary_key=True),
)