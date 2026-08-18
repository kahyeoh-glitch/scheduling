import os

from sqlmodel import SQLModel, Session, create_engine

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "dev.db"))
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
