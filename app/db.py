import os
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel, Session, create_engine
from app import models

raw_url = os.environ.get("DATABASE_URL", "").strip()
if not raw_url:
    raw_url = "sqlite:///todo.db"
elif raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql://", 1)

is_sqlite = raw_url.startswith("sqlite")
is_vercel = bool(os.environ.get("VERCEL"))
connect_args = {"check_same_thread": False} if is_sqlite else {}
poolclass = NullPool if (is_vercel and not is_sqlite) else None

engine = create_engine(
    raw_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    poolclass=poolclass,
)


def create_db():
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as exc:
        print(f"Database init warning: {exc}")


def get_session():
    with Session(engine) as session:
        yield session
