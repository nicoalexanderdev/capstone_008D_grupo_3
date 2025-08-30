from fastapi import FastAPI
from app.auth.controller import router as auth_router
from app.lineas.controller import router as lines_router

def register_routes(app: FastAPI):
    app.include_router(auth_router)
    app.include_router(lines_router)