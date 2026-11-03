import csv
import io
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Laboratory, Request, Allocation, AlgorithmResult
from app.routes.scheduling import _fetch_input_data
from app.algorithms.fcfs import run_fcfs_algorithm
from app.algorithms.best_fit import run_best_fit_algorithm
from app.algorithms.or_tools_solver import run_or_tools_solver

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/export-csv")
def export_allocations_csv(
    algorithm: str = Query("OR_TOOLS", description="Algorithm name: FCFS, BEST_FIT, OR_TOOLS, or ALL"),
    db: Session = Depends(get_db)
):
    labs_data, reqs_data = _fetch_input_data(db)

    allocations = []
    if algorithm.upper() == "FCFS":
        res = run_fcfs_algorithm(labs_data, reqs_data)
        allocations = res["allocations"]
    elif algorithm.upper() == "BEST_FIT":
        res = run_best_fit_algorithm(labs_data, reqs_data)
        allocations = res["allocations"]
    elif algorithm.upper() == "OR_TOOLS":
        res = run_or_tools_solver(labs_data, reqs_data, time_limit_seconds=10.0)
        allocations = res["allocations"]
    else:
        # Fetch from database allocations table
        allocs_db = db.query(Allocation).all()
        for a in allocs_db:
            allocations.append({
                "request_code": a.request.request_code if a.request else f"R{a.request_id}",
                "department_name": a.request.department.department_name if (a.request and a.request.department) else "N/A",
                "lab_name": a.laboratory.lab_name if a.laboratory else "N/A",
                "time_slot": a.time_slot,
                "computers_required": a.request.computers_required if a.request else 0,
                "capacity": a.laboratory.capacity if a.laboratory else 0,
                "unused_seats": a.unused_seats,
                "algorithm_name": a.algorithm_name
            })

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Request Code",
        "Department",
        "Laboratory",
        "Time Slot",
        "Computers Required",
        "Laboratory Capacity",
        "Unused Seats",
        "Algorithm"
    ])

    for a in allocations:
        writer.writerow([
            a.get("request_code", ""),
            a.get("department_name", ""),
            a.get("lab_name", ""),
            a.get("time_slot", ""),
            a.get("computers_required", 0),
            a.get("capacity", 0),
            a.get("unused_seats", 0),
            a.get("algorithm_name", "")
        ])

    csv_data = output.getvalue()
    filename = f"lab_allocations_{algorithm.lower()}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    labs_data, reqs_data = _fetch_input_data(db)
    fcfs_result = run_fcfs_algorithm(labs_data, reqs_data) if (labs_data and reqs_data) else None
    best_fit_result = run_best_fit_algorithm(labs_data, reqs_data) if (labs_data and reqs_data) else None
    or_tools_result = run_or_tools_solver(labs_data, reqs_data, time_limit_seconds=10.0) if (labs_data and reqs_data) else None
    history = db.query(AlgorithmResult).order_by(AlgorithmResult.created_at.desc()).limit(20).all()

    return {
        "fcfs_schedule": fcfs_result,
        "best_fit_schedule": best_fit_result,
        "or_tools_schedule": or_tools_result,
        "history": history
    }
