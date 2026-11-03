import time
from typing import List, Dict, Any
from app.algorithms.validator import validate_schedule

def run_fcfs_algorithm(
    laboratories: List[Dict[str, Any]],
    requests: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    First Come First Served (FCFS) Scheduling Algorithm:
    - Iterates through requests in order of arrival.
    - Scans available laboratories and allowed slots in deterministic order.
    - Allocates the first valid (lab, slot) combination meeting capacity and availability constraints.
    - If no valid slot is available, marks request as unallocated.
    """
    start_time = time.perf_counter()

    # Pre-build lookup dictionaries
    labs_dict = {lab["id"]: lab for lab in laboratories}
    reqs_dict = {req["id"]: req for req in requests}

    # Deterministic lab ordering by name
    sorted_labs = sorted(laboratories, key=lambda l: l["lab_name"])

    # Booked map: (lab_id, time_slot) -> request_id
    booked_slots = set()

    allocations = []
    unallocated = []

    # Process requests in given order
    for req in requests:
        req_id = req["id"]
        req_code = req["request_code"]
        needed_seats = req["computers_required"]
        allowed_slots = req["allowed_slots"]

        allocated = False

        # Deterministic scan: for each allowed slot in request order
        # look through sorted labs
        for slot in sorted(allowed_slots):
            for lab in sorted_labs:
                lab_id = lab["id"]
                cap = lab["capacity"]
                avail_slots = lab["available_slots"]

                # Check if slot is available in this lab
                if slot not in avail_slots:
                    continue

                # Check capacity constraint
                if cap < needed_seats:
                    continue

                # Check double-booking constraint
                if (lab_id, slot) in booked_slots:
                    continue

                # Valid allocation found!
                booked_slots.add((lab_id, slot))
                unused = cap - needed_seats
                allocations.append({
                    "request_id": req_id,
                    "request_code": req_code,
                    "department_name": req.get("department_name", "N/A"),
                    "laboratory_id": lab_id,
                    "lab_name": lab["lab_name"],
                    "time_slot": slot,
                    "computers_required": needed_seats,
                    "capacity": cap,
                    "unused_seats": unused,
                    "algorithm_name": "FCFS"
                })
                allocated = True
                break

            if allocated:
                break

        if not allocated:
            unallocated.append({
                "request_id": req_id,
                "request_code": req_code,
                "department_name": req.get("department_name", "N/A"),
                "computers_required": needed_seats,
                "allowed_slots": allowed_slots,
                "reason": "No laboratory with sufficient capacity was available in the requested time slots."
            })

    end_time = time.perf_counter()
    runtime_ms = round((end_time - start_time) * 1000, 4)

    # Validate constraints
    is_valid, conflicts, error_messages = validate_schedule(allocations, labs_dict, reqs_dict)

    scheduled_count = len(allocations)
    unallocated_count = len(unallocated)
    total_unused_seats = sum(a["unused_seats"] for a in allocations)
    total_reqs = scheduled_count + unallocated_count
    scheduling_percentage = round((scheduled_count / total_reqs * 100), 2) if total_reqs > 0 else 0.0

    return {
        "algorithm_name": "FCFS",
        "scheduled_count": scheduled_count,
        "unallocated_count": unallocated_count,
        "total_unused_seats": total_unused_seats,
        "conflicts": conflicts,
        "runtime_ms": runtime_ms,
        "scheduling_percentage": scheduling_percentage,
        "allocations": allocations,
        "unallocated": unallocated,
        "is_valid": is_valid,
        "error_messages": error_messages
    }

