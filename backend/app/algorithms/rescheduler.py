from typing import List, Dict, Any, Tuple
import copy
from app.algorithms.best_fit import run_best_fit_algorithm
from app.algorithms.fcfs import run_fcfs_algorithm
from app.algorithms.or_tools_solver import run_or_tools_solver
from app.algorithms.validator import validate_schedule

def perform_rescheduling(
    laboratories: List[Dict[str, Any]],
    requests: List[Dict[str, Any]],
    unavailable_lab_name: str,
    unavailable_slot: str,
    base_algorithm: str = "BEST_FIT",
    previous_allocations: List[Dict[str, Any]] = None,
    time_limit_seconds: float = 5.0
) -> Dict[str, Any]:
    """
    Simulates or performs dynamic rescheduling when a laboratory becomes unavailable in a specific slot.
    Principles:
    1. Update the laboratory's available slots by removing the unavailable slot.
    2. Identify existing allocations that are now invalidated (assigned to that lab in that slot).
    3. Preserve unaffected allocations where feasible.
    4. Attempt to reallocate affected requests to remaining feasible (lab, slot) slots.
    5. Support all three algorithms: FCFS, BEST_FIT, and OR_TOOLS.
    6. Return detailed before-and-after comparison, changed count, and unrescheduled requests.
    """
    # 1. Establish baseline schedule if not provided
    if not previous_allocations:
        base_algo_upper = base_algorithm.upper()
        if base_algo_upper == "FCFS":
            base_run = run_fcfs_algorithm(laboratories, requests)
        elif base_algo_upper == "OR_TOOLS":
            base_run = run_or_tools_solver(laboratories, requests, time_limit_seconds=time_limit_seconds)
        else:
            base_run = run_best_fit_algorithm(laboratories, requests)
        old_allocations = base_run["allocations"]
    else:
        old_allocations = copy.deepcopy(previous_allocations)

    old_alloc_map = {a["request_id"]: a for a in old_allocations}

    # 2. Clone labs and remove the unavailable slot from the target lab
    updated_labs = []
    for lab in laboratories:
        lab_copy = copy.deepcopy(lab)
        if lab_copy["lab_name"] == unavailable_lab_name:
            if unavailable_slot in lab_copy["available_slots"]:
                lab_copy["available_slots"] = [s for s in lab_copy["available_slots"] if s != unavailable_slot]
        updated_labs.append(lab_copy)

    # 3. Identify affected requests (allocated to unavailable lab & slot)
    affected_req_ids = set()
    for a in old_allocations:
        if a["lab_name"] == unavailable_lab_name and a["time_slot"] == unavailable_slot:
            affected_req_ids.add(a["request_id"])

    # Smart minimal-churn reassignment:
    # Keep unaffected allocations fixed first:
    fixed_allocations = []
    booked_slots = set()
    for a in old_allocations:
        if a["request_id"] not in affected_req_ids:
            # Check if this allocation is still valid with updated labs
            lab = next((l for l in updated_labs if l["id"] == a["laboratory_id"]), None)
            if lab and a["time_slot"] in lab["available_slots"] and lab["capacity"] >= a["computers_required"]:
                fixed_allocations.append(copy.deepcopy(a))
                booked_slots.add((a["laboratory_id"], a["time_slot"]))
            else:
                affected_req_ids.add(a["request_id"])

    # Attempt to reallocate affected requests
    affected_requests = [r for r in requests if r["id"] in affected_req_ids]
    affected_requests.sort(key=lambda r: r["computers_required"], reverse=True)

    reassigned_allocations = []
    unrescheduled_requests = []

    for req in affected_requests:
        req_id = req["id"]
        req_code = req["request_code"]
        needed = req["computers_required"]
        allowed = req["allowed_slots"]

        candidates = []
        for lab in updated_labs:
            lab_id = lab["id"]
            cap = lab["capacity"]
            avail_slots = lab["available_slots"]

            if cap < needed:
                continue

            for slot in allowed:
                if slot not in avail_slots:
                    continue
                if (lab_id, slot) in booked_slots:
                    continue

                candidates.append({
                    "laboratory": lab,
                    "slot": slot,
                    "unused_seats": cap - needed
                })

        if not candidates:
            unrescheduled_requests.append({
                "request_id": req_id,
                "request_code": req_code,
                "department_name": req.get("department_name", "N/A"),
                "computers_required": needed,
                "allowed_slots": allowed,
                "reason": f"No available laboratory can accommodate {needed} computers in slots {allowed} after {unavailable_lab_name} in {unavailable_slot} became unavailable."
            })
            continue

        # Sort candidates by smallest unused seats
        candidates.sort(key=lambda c: (c["unused_seats"], c["slot"], c["laboratory"]["lab_name"]))
        chosen = candidates[0]
        chosen_lab = chosen["laboratory"]
        chosen_slot = chosen["slot"]

        booked_slots.add((chosen_lab["id"], chosen_slot))
        new_alloc = {
            "request_id": req_id,
            "request_code": req_code,
            "department_name": req.get("department_name", "N/A"),
            "laboratory_id": chosen_lab["id"],
            "lab_name": chosen_lab["lab_name"],
            "time_slot": chosen_slot,
            "computers_required": needed,
            "capacity": chosen_lab["capacity"],
            "unused_seats": chosen["unused_seats"],
            "algorithm_name": "RESCHEDULED"
        }
        reassigned_allocations.append(new_alloc)

    # Combined new allocations
    new_allocations = fixed_allocations + reassigned_allocations

    # If greedy reassignment left requests unallocated, check full recalculation with base algorithm
    if unrescheduled_requests:
        base_algo_upper = base_algorithm.upper()
        if base_algo_upper == "OR_TOOLS":
            fallback_run = run_or_tools_solver(updated_labs, requests, time_limit_seconds=time_limit_seconds)
        elif base_algo_upper == "FCFS":
            fallback_run = run_fcfs_algorithm(updated_labs, requests)
        else:
            fallback_run = run_best_fit_algorithm(updated_labs, requests)

        if fallback_run["scheduled_count"] > len(new_allocations):
            # Prioritize maximizing scheduled requests!
            new_allocations = fallback_run["allocations"]
            unrescheduled_requests = fallback_run["unallocated"]

    # Calculate assignments changed count
    assignments_changed_count = 0
    new_alloc_map = {a["request_id"]: a for a in new_allocations}

    for req_id, old_alloc in old_alloc_map.items():
        new_alloc = new_alloc_map.get(req_id)
        if not new_alloc:
            assignments_changed_count += 1
        elif (new_alloc["laboratory_id"] != old_alloc["laboratory_id"] or
              new_alloc["time_slot"] != old_alloc["time_slot"]):
            assignments_changed_count += 1

    return {
        "unavailable_lab_name": unavailable_lab_name,
        "unavailable_slot": unavailable_slot,
        "base_algorithm": base_algorithm,
        "original_scheduled_count": len(old_allocations),
        "new_scheduled_count": len(new_allocations),
        "assignments_changed_count": assignments_changed_count,
        "unrescheduled_requests": unrescheduled_requests,
        "old_allocations": old_allocations,
        "new_allocations": new_allocations,
        "updated_labs": updated_labs,
        "message": f"Rescheduling completed for {unavailable_lab_name} slot {unavailable_slot}. {assignments_changed_count} assignment(s) changed."
    }
