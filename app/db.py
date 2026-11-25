import os
from sqlmodel import SQLModel, Session, create_engine
from app import models

raw_url = os.environ.get("DATABASE_URL", "").strip()
if not raw_url:
    raw_url = "sqlite:///todo.db"
elif raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if raw_url.startswith("sqlite") else {}
engine = create_engine(raw_url, connect_args=connect_args, pool_pre_ping=True)


def create_db():
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as exc:
        print(f"Database init warning: {exc}")


def get_session():
    with Session(engine) as session:
        yield session
