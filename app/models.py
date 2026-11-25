from typing import Optional
from datetime import date, datetime
from sqlmodel import SQLModel, Field


class List(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    list_id: int = Field(foreign_key="list.id")
    title: str
    note: str = ""
    due_date: Optional[date] = None
    important: bool = False
    done: bool = False
    repeat: str = "none"
    remind_at: Optional[datetime] = None


class ListCreate(SQLModel):
    name: str = Field(min_length=1, max_length=200)


class TaskCreate(SQLModel):
    list_id: int
    title: str = Field(min_length=1, max_length=200)
    note: str = ""
    due_date: Optional[date] = None
    important: bool = False
    repeat: str = "none"
    remind_at: Optional[datetime] = None


class TaskUpdate(SQLModel):
    list_id: Optional[int] = None
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    note: Optional[str] = None
    due_date: Optional[date] = None
    important: Optional[bool] = None
    done: Optional[bool] = None
    repeat: Optional[str] = None
    remind_at: Optional[datetime] = None
