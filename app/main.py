from fastapi import FastAPI
from app.routes import router

app = FastAPI(title="To Do")

app.include_router(router)