import os
from sqlmodel import SQLModel, Session, create_engine
from app import models


def _normalize_db_url(raw_url: str) -> str:
    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


def _build_engine():
    raw_url = os.environ.get("DATABASE_URL", "").strip()
    if raw_url:
        normalized = _normalize_db_url(raw_url)
        try:
            kwargs = {"pool_pre_ping": True}
            if normalized.startswith("sqlite"):
                kwargs["connect_args"] = {"check_same_thread": False}
            return create_engine(normalized, **kwargs)
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
