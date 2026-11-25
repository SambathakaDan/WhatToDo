from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import List, ListCreate, Task, TaskCreate, TaskUpdate

router = APIRouter()


def get_user_id(x_user_id: str = Header(default="default-user")) -> str:
    return x_user_id.strip() or "default-user"


@router.get("/lists")
def read_lists(user_id: str = Depends(get_user_id), session: Session = Depends(get_session)):
    return session.exec(select(List).where(List.user_id == user_id)).all()


@router.post("/lists")
def create_list(data: ListCreate, user_id: str = Depends(get_user_id), session: Session = Depends(get_session)):
    item = List(name=data.name, user_id=user_id)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/lists/{list_id}")
def delete_list(list_id: int, user_id: str = Depends(get_user_id), session: Session = Depends(get_session)):
    item = session.exec(select(List).where(List.id == list_id, List.user_id == user_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="List not found")
    tasks = session.exec(select(Task).where(Task.list_id == list_id, Task.user_id == user_id)).all()
    for t in tasks:
        session.delete(t)
    session.delete(item)
    session.commit()
    return {"ok": True}


@router.get("/tasks")
def read_tasks(user_id: str = Depends(get_user_id), session: Session = Depends(get_session)):
    return session.exec(select(Task).where(Task.user_id == user_id)).all()


@router.post("/tasks")
def create_task(data: TaskCreate, user_id: str = Depends(get_user_id), session: Session = Depends(get_session)):
    parent = session.exec(select(List).where(List.id == data.list_id, List.user_id == user_id)).first()
    if not parent:
        raise HTTPException(status_code=404, detail="List not found")
    task = Task(**data.model_dump(), user_id=user_id)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.patch("/tasks/{task_id}")
def update_task(task_id: int, data: TaskUpdate, user_id: str = Depends(get_user_id), session: Session = Depends(get_session)):
    task = session.exec(select(Task).where(Task.id == task_id, Task.user_id == user_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, user_id: str = Depends(get_user_id), session: Session = Depends(get_session)):
    task = session.exec(select(Task).where(Task.id == task_id, Task.user_id == user_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(task)
    session.commit()
    return {"ok": True}
