from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Department, Request
from app.schemas import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/api/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).order_by(Department.department_name).all()
    results = []
    for d in depts:
        count = db.query(Request).filter(Request.department_id == d.id).count()
        results.append({
            "id": d.id,
            "department_name": d.department_name,
            "requests_count": count
        })
    return results

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Department).filter(Department.department_name == dept_in.department_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department '{dept_in.department_name}' already exists."
        )
    dept = Department(department_name=dept_in.department_name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": dept.id, "department_name": dept.department_name, "requests_count": 0}

@router.get("/{id}", response_model=DepartmentResponse)
def get_department(id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    count = db.query(Request).filter(Request.department_id == dept.id).count()
    return {"id": dept.id, "department_name": dept.department_name, "requests_count": count}

@router.put("/{id}", response_model=DepartmentResponse)
def update_department(id: int, dept_in: DepartmentUpdate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if dept_in.department_name and dept_in.department_name != dept.department_name:
        existing = db.query(Department).filter(Department.department_name == dept_in.department_name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department '{dept_in.department_name}' already exists."
            )
        dept.department_name = dept_in.department_name
        db.commit()
        db.refresh(dept)
    count = db.query(Request).filter(Request.department_id == dept.id).count()
    return {"id": dept.id, "department_name": dept.department_name, "requests_count": count}

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return None

