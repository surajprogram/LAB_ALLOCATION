from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Laboratory
from app.schemas import LabCreate, LabUpdate, LabResponse

router = APIRouter(prefix="/api/labs", tags=["Laboratories"])

@router.get("", response_model=List[LabResponse])
def get_laboratories(db: Session = Depends(get_db)):
    return db.query(Laboratory).order_by(Laboratory.lab_name).all()

@router.post("", response_model=LabResponse, status_code=status.HTTP_201_CREATED)
def create_laboratory(lab_in: LabCreate, db: Session = Depends(get_db)):
    existing = db.query(Laboratory).filter(Laboratory.lab_name == lab_in.lab_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Laboratory with name '{lab_in.lab_name}' already exists."
        )
    lab = Laboratory(
        lab_name=lab_in.lab_name,
        capacity=lab_in.capacity,
        available_slots=lab_in.available_slots
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab

@router.get("/{id}", response_model=LabResponse)
def get_laboratory(id: int, db: Session = Depends(get_db)):
    lab = db.query(Laboratory).filter(Laboratory.id == id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    return lab

@router.put("/{id}", response_model=LabResponse)
def update_laboratory(id: int, lab_in: LabUpdate, db: Session = Depends(get_db)):
    lab = db.query(Laboratory).filter(Laboratory.id == id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    
    if lab_in.lab_name and lab_in.lab_name != lab.lab_name:
        existing = db.query(Laboratory).filter(Laboratory.lab_name == lab_in.lab_name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Laboratory name '{lab_in.lab_name}' is already taken."
            )
        lab.lab_name = lab_in.lab_name
    
    if lab_in.capacity is not None:
        lab.capacity = lab_in.capacity
    if lab_in.available_slots is not None:
        lab.available_slots = lab_in.available_slots

    db.commit()
    db.refresh(lab)
    return lab

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_laboratory(id: int, db: Session = Depends(get_db)):
    lab = db.query(Laboratory).filter(Laboratory.id == id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    db.delete(lab)
    db.commit()
    return None

