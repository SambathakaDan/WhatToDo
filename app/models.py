from typing import Optional              # lets a field be "a value or None"
from datetime import date                # a type for dates like 2026-11-14
from sqlmodel import SQLModel, Field     # SQLModel = base class, Field = column settings


class List(SQLModel, table=True):        # table=True means "make this a real table"
    id: Optional[int] = Field(default=None, primary_key=True)
    # id is the unique number of each list. None at first, the database fills it in
    name: str                            # the list name, like "Uni"


class Task(SQLModel, table=True):        # a second table, for tasks
    id: Optional[int] = Field(default=None, primary_key=True)  # unique task number
    list_id: int = Field(foreign_key="list.id")
    # which list this task belongs to; "list.id" points at the List table's id
    title: str                           # task title, required
    note: str = ""                       # optional note, empty by default
    due_date: Optional[date] = None      # optional due date
    important: bool = False              # the star, off by default
    done: bool = False                   # the checkbox, off by default

class ListCreate(SQLModel):              # what the frontend sends to create a list
    name: str = Field(min_length=1, max_length=200)
    # 1 to 200 characters, otherwise FastAPI sends 422 automatically


class TaskCreate(SQLModel):              # what the frontend sends to create a task
    list_id: int                         # which list the task goes in
    title: str = Field(min_length=1, max_length=200)   # same 1 to 200 rule
    note: str = ""                       # optional
    due_date: Optional[date] = None      # optional
    important: bool = False              # optional

class TaskUpdate(SQLModel):              # what the frontend sends to change a task
    list_id: Optional[int] = None        # every field is optional, send only what changed
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    # if title is sent, it must still be 1 to 200 characters
    note: Optional[str] = None
    due_date: Optional[date] = None
    important: Optional[bool] = None
    done: Optional[bool] = None