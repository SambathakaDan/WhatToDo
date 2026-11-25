from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_session
from app.models import List, Task, ListCreate, TaskCreate, TaskUpdate   # TaskUpdate is new

router = APIRouter(prefix="/api")


@router.get("/lists", response_model=list[List])
def get_lists(session: Session = Depends(get_session)):
    return session.exec(select(List)).all()


@router.get("/tasks", response_model=list[Task])
def get_tasks(session: Session = Depends(get_session)):
    return session.exec(select(Task)).all()


@router.post("/lists", response_model=List, status_code=201)
def create_list(data: ListCreate, session: Session = Depends(get_session)):
    new_list = List.model_validate(data)
    session.add(new_list)
    session.commit()
    session.refresh(new_list)
    return new_list


@router.post("/tasks", response_model=Task, status_code=201)
def create_task(data: TaskCreate, session: Session = Depends(get_session)):
    if not session.get(List, data.list_id):
        raise HTTPException(404, "List not found")
    task = Task.model_validate(data)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=Task)   # {task_id} is the number in the URL
def update_task(task_id: int, data: TaskUpdate, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)                    # find the task by its id
    if not task:
        raise HTTPException(404, "Task not found")       # no such task, answer 404

    changes = data.model_dump(exclude_unset=True)
    # only the fields the frontend actually sent, so unsent fields stay unchanged

    if "list_id" in changes and not session.get(List, changes["list_id"]):
        raise HTTPException(404, "List not found")       # moving to a list that doesn't exist

    for key, value in changes.items():                   # go through each changed field
        setattr(task, key, value)                        # set task.key = value

    session.add(task)
    session.commit()                                     # save to todo.db
    session.refresh(task)
    return task                                          # send the updated task back (200)

@router.delete("/tasks/{task_id}", status_code=204)   # 204 = success, nothing to send back
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)                 # find the task by its id
    if not task:
        raise HTTPException(404, "Task not found")    # no such task, answer 404
    session.delete(task)                              # remove it
    session.commit()                                  # save the change to todo.db
    # no return, 204 means an empty answer


@router.delete("/lists/{list_id}", status_code=204)
def delete_list(list_id: int, session: Session = Depends(get_session)):
    the_list = session.get(List, list_id)             # find the list by its id
    if not the_list:
        raise HTTPException(404, "List not found")    # no such list, answer 404

    tasks = session.exec(select(Task).where(Task.list_id == list_id)).all()
    # get every task that belongs to this list

    for task in tasks:                                # delete each of those tasks first
        session.delete(task)

    session.delete(the_list)                          # then delete the list itself
    session.commit()                                  # save everything at once