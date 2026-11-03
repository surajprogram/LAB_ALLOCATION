from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.seed_data import seed_database

router = APIRouter(prefix="/api/seed", tags=["Seed Data"])

@router.post("")
def reset_and_seed_data(force: bool = True, db: Session = Depends(get_db)):
    seed_database(db, force=force)
    return {"message": "Database successfully reset and seeded with standard sample dataset."}

