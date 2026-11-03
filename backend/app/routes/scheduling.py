from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models import Laboratory, Request, Allocation, AlgorithmResult
from app.schemas import ScheduleRunResponse, AlgorithmResultResponse
from app.algorithms.fcfs import run_fcfs_algorithm
from app.algorithms.best_fit import run_best_fit_algorithm
from app.algorithms.or_tools_solver import run_or_tools_solver

router = APIRouter(prefix="/api/schedule", tags=["Scheduling"])

def _fetch_input_data(db: Session):
    labs = db.query(Laboratory).order_by(Laboratory.lab_name).all()
    requests = db.query(Request).order_by(Request.request_code).all()

    labs_data = [
        {
            "id": l.id,
            "lab_name": l.lab_name,
            "capacity": l.capacity,
            "available_slots": l.available_slots or []
        }
        for l in labs
    ]

    reqs_data = [
        {
            "id": r.id,
            "request_code": r.request_code,
            "department_id": r.department_id,
            "department_name": r.department.department_name if r.department else "N/A",
            "computers_required": r.computers_required,
            "allowed_slots": r.allowed_slots or []
        }
        for r in requests
    ]
    return labs_data, reqs_data

def _build_matrix(allocations: List[Dict[str, Any]], labs: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Unique slots
    all_slots = sorted(list(set(s for l in labs for s in l.get("available_slots", []))))
    if not all_slots:
        all_slots = ["S1", "S2", "S3"]

    # Matrix: { lab_name: { slot: alloc_or_null } }
    matrix = {}
    for l in labs:
        matrix[l["lab_name"]] = {s: None for s in all_slots}

    for a in allocations:
        lab_name = a["lab_name"]
        slot = a["time_slot"]
        if lab_name in matrix and slot in matrix[lab_name]:
            matrix[lab_name][slot] = a

    return {"slots": all_slots, "grid": matrix}

def _persist_schedule(db: Session, result: Dict[str, Any], algorithm_name: str):
    # Remove existing allocations for this algorithm
    db.query(Allocation).filter(Allocation.algorithm_name == algorithm_name).delete()

    for item in result["allocations"]:
        alloc = Allocation(
            request_id=item["request_id"],
            laboratory_id=item["laboratory_id"],
            time_slot=item["time_slot"],
            algorithm_name=algorithm_name,
            unused_seats=item["unused_seats"]
        )
        db.add(alloc)

    # Save algorithm result record
    algo_result = AlgorithmResult(
        algorithm_name=algorithm_name,
        scheduled_count=result["scheduled_count"],
        unallocated_count=result["unallocated_count"],
        total_unused_seats=result["total_unused_seats"],
        conflicts=result["conflicts"],
        runtime_ms=result["runtime_ms"]
    )
    db.add(algo_result)
    db.commit()

@router.post("/fcfs", response_model=ScheduleRunResponse)
def execute_fcfs(db: Session = Depends(get_db)):
    labs_data, reqs_data = _fetch_input_data(db)
    if not labs_data:
        raise HTTPException(status_code=400, detail="No laboratories found in database.")
    if not reqs_data:
        raise HTTPException(status_code=400, detail="No requests found in database.")

    result = run_fcfs_algorithm(labs_data, reqs_data)
    _persist_schedule(db, result, "FCFS")
    result["matrix"] = _build_matrix(result["allocations"], labs_data)
    return result

@router.post("/best-fit", response_model=ScheduleRunResponse)
def execute_best_fit(db: Session = Depends(get_db)):
    labs_data, reqs_data = _fetch_input_data(db)
    if not labs_data:
        raise HTTPException(status_code=400, detail="No laboratories found in database.")
    if not reqs_data:
        raise HTTPException(status_code=400, detail="No requests found in database.")

    result = run_best_fit_algorithm(labs_data, reqs_data)
    _persist_schedule(db, result, "BEST_FIT")
    result["matrix"] = _build_matrix(result["allocations"], labs_data)
    return result

@router.post("/or-tools", response_model=ScheduleRunResponse)
def execute_or_tools(
    time_limit_seconds: float = Query(10.0, ge=0.5, le=60.0, description="Solver time limit in seconds"),
    db: Session = Depends(get_db)
):
    labs_data, reqs_data = _fetch_input_data(db)
    if not labs_data:
        raise HTTPException(status_code=400, detail="No laboratories found in database.")
    if not reqs_data:
        raise HTTPException(status_code=400, detail="No requests found in database.")

    result = run_or_tools_solver(labs_data, reqs_data, time_limit_seconds=time_limit_seconds)
    _persist_schedule(db, result, "OR_TOOLS")
    result["matrix"] = _build_matrix(result["allocations"], labs_data)
    return result

@router.get("/results", response_model=List[AlgorithmResultResponse])
def get_algorithm_results(db: Session = Depends(get_db)):
    return db.query(AlgorithmResult).order_by(AlgorithmResult.created_at.desc()).limit(20).all()

@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_allocations(db: Session = Depends(get_db)):
    db.query(Allocation).delete()
    db.commit()
    return None

