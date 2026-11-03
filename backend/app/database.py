import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.get_database_url

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        echo=False
    )
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info("Connected to PostgreSQL successfully.")
except Exception as e:
    logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to local SQLite database.")
    db_url = "sqlite:///./campus_lab_optimizer.db"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

