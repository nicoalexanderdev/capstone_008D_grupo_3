from fastapi import FastAPI
from app.auth.controller import router as auth_router
from app.lineas.controller import router as lines_router
from app.estaciones.controller import router as estations_router
from app.lineas_estaciones.controller import router as lineas_estaciones_router
from app.sentidos.controller import router as sentidos_router
from app.accesos.controller import router as accesos_router
from app.horarios.controller import router as horarios_router
from app.recorridos.controller import router as recorridos_router

def register_routes(app: FastAPI, prefix: str = ""):
    app.include_router(auth_router, prefix=prefix)
    app.include_router(lines_router, prefix=prefix)
    app.include_router(estations_router, prefix=prefix)
    app.include_router(lineas_estaciones_router, prefix=prefix)
    app.include_router(sentidos_router, prefix=prefix)
    app.include_router(accesos_router, prefix=prefix)
    app.include_router(horarios_router, prefix=prefix)
    app.include_router(recorridos_router, prefix=prefix)