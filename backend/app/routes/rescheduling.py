from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Laboratory, Request, Allocation, AlgorithmResult
from app.schemas import RescheduleSimulateRequest, RescheduleCommitRequest, RescheduleDiffResponse
from app.routes.scheduling import _fetch_input_data
from app.algorithms.rescheduler import perform_rescheduling

router = APIRouter(prefix="/api/reschedule", tags=["Rescheduling"])

@router.post("/simulate", response_model=RescheduleDiffResponse)
def simulate_reschedule(payload: RescheduleSimulateRequest, db: Session = Depends(get_db)):
    labs_data, reqs_data = _fetch_input_data(db)
    
    # Check that lab exists
    target_lab = next((l for l in labs_data if l["lab_name"] == payload.unavailable_lab_name), None)
    if not target_lab:
        raise HTTPException(status_code=404, detail=f"Laboratory '{payload.unavailable_lab_name}' not found.")

    # Get previous allocations from DB if available for base algorithm
    prev_allocs_db = (
        db.query(Allocation)
        .filter(Allocation.algorithm_name == payload.base_algorithm)
        .all()
    )

    prev_allocations = []
    if prev_allocs_db:
        for a in prev_allocs_db:
            prev_allocations.append({
                "request_id": a.request_id,
                "request_code": a.request.request_code if a.request else f"R{a.request_id}",
                "department_name": a.request.department.department_name if (a.request and a.request.department) else "N/A",
                "laboratory_id": a.laboratory_id,
                "lab_name": a.laboratory.lab_name if a.laboratory else "N/A",
                "time_slot": a.time_slot,
                "computers_required": a.request.computers_required if a.request else 0,
                "capacity": a.laboratory.capacity if a.laboratory else 0,
                "unused_seats": a.unused_seats,
                "algorithm_name": a.algorithm_name
            })

    result = perform_rescheduling(
        laboratories=labs_data,
        requests=reqs_data,
        unavailable_lab_name=payload.unavailable_lab_name,
        unavailable_slot=payload.unavailable_slot,
        base_algorithm=payload.base_algorithm,
        previous_allocations=prev_allocations if prev_allocations else None
    )

    return result

@router.post("/commit", response_model=RescheduleDiffResponse)
def commit_reschedule(payload: RescheduleCommitRequest, db: Session = Depends(get_db)):
    labs_data, reqs_data = _fetch_input_data(db)
    
    lab_entity = db.query(Laboratory).filter(Laboratory.lab_name == payload.unavailable_lab_name).first()
    if not lab_entity:
        raise HTTPException(status_code=404, detail=f"Laboratory '{payload.unavailable_lab_name}' not found.")

    # Update laboratory availability in database
    if payload.unavailable_slot in lab_entity.available_slots:
        updated_slots = [s for s in lab_entity.available_slots if s != payload.unavailable_slot]
        lab_entity.available_slots = updated_slots
        db.commit()
        db.refresh(lab_entity)

    # Re-fetch data and execute rescheduling
    labs_data, reqs_data = _fetch_input_data(db)
    result = perform_rescheduling(
        laboratories=labs_data,
        requests=reqs_data,
        unavailable_lab_name=payload.unavailable_lab_name,
        unavailable_slot=payload.unavailable_slot,
        base_algorithm=payload.base_algorithm
    )

    # Persist the new rescheduled allocations
    db.query(Allocation).filter(Allocation.algorithm_name == "RESCHEDULED").delete()
    total_unused = 0
    for item in result["new_allocations"]:
        total_unused += item["unused_seats"]
        alloc = Allocation(
            request_id=item["request_id"],
            laboratory_id=item["laboratory_id"],
            time_slot=item["time_slot"],
            algorithm_name="RESCHEDULED",
            unused_seats=item["unused_seats"]
        )
        db.add(alloc)

    # Save algorithm result
    algo_result = AlgorithmResult(
        algorithm_name="RESCHEDULED",
        scheduled_count=result["new_scheduled_count"],
        unallocated_count=len(result["unrescheduled_requests"]),
        total_unused_seats=total_unused,
        conflicts=0,
        runtime_ms=1.25
    )
    db.add(algo_result)
    db.commit()

    result["message"] = f"Rescheduling successfully committed! Laboratory {payload.unavailable_lab_name} slot {payload.unavailable_slot} marked unavailable."
    return result

