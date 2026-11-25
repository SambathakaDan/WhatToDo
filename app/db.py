import os
from sqlmodel import SQLModel, Session, create_engine
from app import models


def _build_engine():
    raw_url = os.environ.get("DATABASE_URL", "").strip()
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    if raw_url:
        try:
            kwargs = {"pool_pre_ping": True}
            if raw_url.startswith("sqlite"):
                kwargs["connect_args"] = {"check_same_thread": False}
            return create_engine(raw_url, **kwargs)
        except Exception as exc:
            print(f"DATABASE_URL engine error, falling back to /tmp/todo.db: {exc}")

    fallback_url = "sqlite:////tmp/todo.db" if os.environ.get("VERCEL") else "sqlite:///todo.db"
    return create_engine(fallback_url, connect_args={"check_same_thread": False})


engine = _build_engine()


def create_db():
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as exc:
        print(f"Database init warning: {exc}")


def get_session():
    with Session(engine) as session:
        yield session
