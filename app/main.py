from contextlib import asynccontextmanager   # lets us run code at startup
from fastapi import FastAPI
from app.db import create_db
from app.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):        # FastAPI runs this when the server starts
    create_db()                          # make the tables
    yield                                # the server runs here until you stop it


app = FastAPI(title="To Do", lifespan=lifespan)

app.include_router(router)