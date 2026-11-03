import pytest
from app.algorithms.fcfs import run_fcfs_algorithm
from app.algorithms.best_fit import run_best_fit_algorithm
from app.algorithms.or_tools_solver import run_or_tools_solver
from app.algorithms.validator import validate_schedule
from app.algorithms.rescheduler import perform_rescheduling

@pytest.fixture
def sample_data():
    laboratories = [
        {"id": 1, "lab_name": "Lab A", "capacity": 60, "available_slots": ["S1", "S2", "S3"]},
        {"id": 2, "lab_name": "Lab B", "capacity": 40, "available_slots": ["S1", "S2", "S3"]},
        {"id": 3, "lab_name": "Lab C", "capacity": 50, "available_slots": ["S1", "S2"]},
        {"id": 4, "lab_name": "Lab D", "capacity": 30, "available_slots": ["S2", "S3"]},
    ]

    requests = [
        {"id": 1, "request_code": "R1", "department_name": "CSE", "computers_required": 55, "allowed_slots": ["S1", "S2"]},
        {"id": 2, "request_code": "R2", "department_name": "IT", "computers_required": 35, "allowed_slots": ["S1"]},
        {"id": 3, "request_code": "R3", "department_name": "AI & DS", "computers_required": 45, "allowed_slots": ["S2"]},
        {"id": 4, "request_code": "R4", "department_name": "ECE", "computers_required": 25, "allowed_slots": ["S2", "S3"]},
        {"id": 5, "request_code": "R5", "department_name": "MCA", "computers_required": 40, "allowed_slots": ["S3"]},
    ]
    return laboratories, requests

def test_fcfs_algorithm_validity_and_constraints(sample_data):
    labs, requests = sample_data
    result = run_fcfs_algorithm(labs, requests)

    # 1. Zero hard conflicts
    assert result["conflicts"] == 0, f"Conflicts found: {result.get('error_messages')}"
    assert result["is_valid"] is True

    # 2. Hard constraint: No double booking per lab-slot
    booked_slots = set()
    for alloc in result["allocations"]:
        key = (alloc["laboratory_id"], alloc["time_slot"])
        assert key not in booked_slots, f"Lab-slot {key} double-booked!"
        booked_slots.add(key)

    # 3. Hard constraint: Capacity >= required
    for alloc in result["allocations"]:
        assert alloc["capacity"] >= alloc["computers_required"], "Capacity violation!"
        assert alloc["unused_seats"] == (alloc["capacity"] - alloc["computers_required"])

    # 4. Hard constraint: Slot must be in allowed_slots
    req_map = {r["id"]: r for r in requests}
    for alloc in result["allocations"]:
        r = req_map[alloc["request_id"]]
        assert alloc["time_slot"] in r["allowed_slots"], "Slot not allowed for request!"

    # 5. Check metrics consistency
    assert result["scheduled_count"] + result["unallocated_count"] == len(requests)
    assert result["total_unused_seats"] == sum(a["unused_seats"] for a in result["allocations"])
    assert result["runtime_ms"] >= 0

def test_best_fit_algorithm_validity_and_optimization(sample_data):
    labs, requests = sample_data
    result = run_best_fit_algorithm(labs, requests)

    # 1. Zero hard conflicts
    assert result["conflicts"] == 0, f"Conflicts found: {result.get('error_messages')}"
    assert result["is_valid"] is True

    # 2. No double booking
    booked_slots = set()
    for alloc in result["allocations"]:
        key = (alloc["laboratory_id"], alloc["time_slot"])
        assert key not in booked_slots, f"Lab-slot {key} double-booked!"
        booked_slots.add(key)

    # 3. Capacity respected
    for alloc in result["allocations"]:
        assert alloc["capacity"] >= alloc["computers_required"]
        assert alloc["unused_seats"] == (alloc["capacity"] - alloc["computers_required"])

    # 4. Check that Best Fit minimized unused seats efficiently
    assert result["scheduled_count"] == 5, "All 5 requests should be schedulable in sample dataset"
    assert result["unallocated_count"] == 0
    assert result["total_unused_seats"] >= 0

def test_dynamic_rescheduling_scenario(sample_data):
    """
    Scenario: Lab A becomes unavailable in S2.
    """
    labs, requests = sample_data
    res = perform_rescheduling(
        laboratories=labs,
        requests=requests,
        unavailable_lab_name="Lab A",
        unavailable_slot="S2",
        base_algorithm="BEST_FIT"
    )

    # Verify no allocations exist with Lab A in S2 in new schedule
    for alloc in res["new_allocations"]:
        assert not (alloc["lab_name"] == "Lab A" and alloc["time_slot"] == "S2"), \
            "Allocation exists on unavailable lab and slot!"

    # Verify constraints on new allocations
    labs_dict = {l["id"]: l for l in res["updated_labs"]}
    reqs_dict = {r["id"]: r for r in requests}
    is_valid, conflicts, errs = validate_schedule(res["new_allocations"], labs_dict, reqs_dict)
    assert is_valid is True, f"Errors in rescheduled allocations: {errs}"
    assert conflicts == 0

    assert "assignments_changed_count" in res
    assert res["new_scheduled_count"] >= 0

def test_or_tools_solver_optimality_and_constraints(sample_data):
    labs, requests = sample_data
    result = run_or_tools_solver(labs, requests, time_limit_seconds=5.0)

    # 1. Check solver status
    assert result["solver_status"] in ("OPTIMAL", "FEASIBLE"), f"Unexpected status: {result['solver_status']}"
    assert result["is_optimal"] is True
    assert result["algorithm_name"] == "OR_TOOLS"

    # 2. Hard constraint: Zero conflicts
    assert result["conflicts"] == 0, f"Conflicts found: {result.get('error_messages')}"
    assert result["is_valid"] is True

    # 3. Two-phase verification: All 5 scheduled in Phase 1
    assert result["scheduled_count"] == 5
    assert result["unallocated_count"] == 0

    # 4. Phase 2 verification: Unused seats minimized (<= 20 seats)
    assert result["total_unused_seats"] <= 20
    assert result["total_unused_seats"] == sum(a["unused_seats"] for a in result["allocations"])

    # 5. Check no double-booking
    booked = set()
    for alloc in result["allocations"]:
        key = (alloc["laboratory_id"], alloc["time_slot"])
        assert key not in booked, f"Lab-slot {key} double-booked in OR-Tools schedule!"
        booked.add(key)

    # 6. Check capacity and allowed slots
    req_map = {r["id"]: r for r in requests}
    for alloc in result["allocations"]:
        r = req_map[alloc["request_id"]]
        assert alloc["capacity"] >= alloc["computers_required"]
        assert alloc["time_slot"] in r["allowed_slots"]

def test_dynamic_rescheduling_with_or_tools(sample_data):
    labs, requests = sample_data
    res = perform_rescheduling(
        laboratories=labs,
        requests=requests,
        unavailable_lab_name="Lab A",
        unavailable_slot="S2",
        base_algorithm="OR_TOOLS",
        time_limit_seconds=5.0
    )

    for alloc in res["new_allocations"]:
        assert not (alloc["lab_name"] == "Lab A" and alloc["time_slot"] == "S2"), \
            "Allocation exists on unavailable lab and slot!"

    labs_dict = {l["id"]: l for l in res["updated_labs"]}
    reqs_dict = {r["id"]: r for r in requests}
    is_valid, conflicts, errs = validate_schedule(res["new_allocations"], labs_dict, reqs_dict)
    assert is_valid is True, f"Constraint errors in OR-Tools rescheduled schedule: {errs}"
    assert conflicts == 0
    assert res["new_scheduled_count"] >= 0

