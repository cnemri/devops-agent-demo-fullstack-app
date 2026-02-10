import logging
import sys
import os
import random
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database
from database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

# ── Logging Setup ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("todo-backend")

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── BUG_MODE: Simulates intermittent database connection failures ──
BUG_MODE = os.getenv("BUG_MODE", "false").lower() == "true"
if BUG_MODE:
    logger.warning("⚠️  BUG_MODE is ENABLED — write operations will fail intermittently")


@app.post("/todos", response_model=schemas.Todo)
def create_todo(todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    logger.info(f"POST /todos — Creating todo: title='{todo.title}'")

    if BUG_MODE:
        # Simulate intermittent DB connection pool exhaustion
        if random.random() < 0.7:  # 70% failure rate
            logger.error(
                "DatabaseError: connection pool exhausted — "
                "QueuePool limit of 5 reached, "
                "connection timed out after 30.0 seconds. "
                "Consider increasing pool_size or max_overflow."
            )
            raise HTTPException(
                status_code=503,
                detail="Database connection pool exhausted. Please try again later.",
            )

    db_todo = models.Todo(**todo.model_dump())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    logger.info(f"POST /todos — Created todo id={db_todo.id}")
    return db_todo


@app.get("/todos", response_model=List[schemas.Todo])
def read_todos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info("GET /todos — Fetching todos")
    todos = db.query(models.Todo).offset(skip).limit(limit).all()
    logger.info(f"GET /todos — Returned {len(todos)} todos")
    return todos


@app.get("/todos/{todo_id}", response_model=schemas.Todo)
def read_todo(todo_id: int, db: Session = Depends(get_db)):
    logger.info(f"GET /todos/{todo_id}")
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if db_todo is None:
        logger.warning(f"GET /todos/{todo_id} — Not found")
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo


@app.put("/todos/{todo_id}", response_model=schemas.Todo)
def update_todo(todo_id: int, todo: schemas.TodoUpdate, db: Session = Depends(get_db)):
    logger.info(f"PUT /todos/{todo_id}")
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if db_todo is None:
        logger.warning(f"PUT /todos/{todo_id} — Not found")
        raise HTTPException(status_code=404, detail="Todo not found")

    if BUG_MODE:
        if random.random() < 0.7:
            logger.error(
                "DatabaseError: connection pool exhausted — "
                "QueuePool limit of 5 reached, "
                "connection timed out after 30.0 seconds."
            )
            raise HTTPException(
                status_code=503,
                detail="Database connection pool exhausted. Please try again later.",
            )

    update_data = todo.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)

    db.commit()
    db.refresh(db_todo)
    logger.info(f"PUT /todos/{todo_id} — Updated successfully")
    return db_todo


@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    logger.info(f"DELETE /todos/{todo_id}")
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if db_todo is None:
        logger.warning(f"DELETE /todos/{todo_id} — Not found")
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    logger.info(f"DELETE /todos/{todo_id} — Deleted successfully")
    return {"message": "Todo deleted successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
