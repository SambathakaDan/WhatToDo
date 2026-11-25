from contextlib import asynccontextmanager   # lets us run code at startup
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.db import create_db
from app.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):        # FastAPI runs this when the server starts
    create_db()                          # make the tables
    yield                                # the server runs here until you stop it


app = FastAPI(title="To Do", lifespan=lifespan)

app.include_router(router)

# C: serve the frontend from the static/ folder.
# This must stay AFTER all API routes, or "/" would hide them.
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")