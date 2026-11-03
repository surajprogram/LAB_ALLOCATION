from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Request, Department
from app.schemas import RequestCreate, RequestUpdate, RequestResponse

router = APIRouter(prefix="/api/requests", tags=["Requests"])

def _format_request(req: Request) -> dict:
    return {
        "id": req.id,
        "request_code": req.request_code,
        "department_id": req.department_id,
        "department_name": req.department.department_name if req.department else "Unknown",
        "computers_required": req.computers_required,
        "allowed_slots": req.allowed_slots,
        "created_at": req.created_at
    }

@router.get("", response_model=List[RequestResponse])
def get_requests(db: Session = Depends(get_db)):
    requests = db.query(Request).order_by(Request.request_code).all()
    return [_format_request(r) for r in requests]

@router.post("", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(req_in: RequestCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == req_in.department_id).first()
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department does not exist."
        )
    existing = db.query(Request).filter(Request.request_code == req_in.request_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request with code '{req_in.request_code}' already exists."
        )
    if not req_in.allowed_slots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one allowed slot must be selected."
        )

    req = Request(
        request_code=req_in.request_code,
        department_id=req_in.department_id,
        computers_required=req_in.computers_required,
        allowed_slots=req_in.allowed_slots
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _format_request(req)

@router.get("/{id}", response_model=RequestResponse)
def get_request(id: int, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return _format_request(req)

@router.put("/{id}", response_model=RequestResponse)
def update_request(id: int, req_in: RequestUpdate, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req_in.department_id is not None:
        dept = db.query(Department).filter(Department.id == req_in.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Department does not exist.")
        req.department_id = req_in.department_id

    if req_in.request_code and req_in.request_code != req.request_code:
        existing = db.query(Request).filter(Request.request_code == req_in.request_code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Request code '{req_in.request_code}' is already taken."
            )
        req.request_code = req_in.request_code

    if req_in.computers_required is not None:
        req.computers_required = req_in.computers_required

    if req_in.allowed_slots is not None:
        if not req_in.allowed_slots:
            raise HTTPException(status_code=400, detail="At least one allowed slot is required.")
        req.allowed_slots = req_in.allowed_slots

    db.commit()
    db.refresh(req)
    return _format_request(req)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(id: int, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(req)
    db.commit()
    return None

