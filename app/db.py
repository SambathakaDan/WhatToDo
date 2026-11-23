from sqlmodel import SQLModel, Session, create_engine
from app import models                   # importing this registers List and Task as tables

engine = create_engine(
    "sqlite:///todo.db",                 # use a SQLite file called todo.db
    connect_args={"check_same_thread": False},  # SQLite setting FastAPI needs
)


def create_db():
    SQLModel.metadata.create_all(engine) # create any missing tables (does nothing if they exist)


def get_session():
    with Session(engine) as session:     # open a connection to the database
        yield session                    # hand it to a route; it closes after the route ends