import time
from typing import List, Dict, Any
from app.algorithms.validator import validate_schedule

def run_best_fit_algorithm(
    laboratories: List[Dict[str, Any]],
    requests: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Best Fit Scheduling Algorithm:
    - Iterates through requests deterministically.
    - Evaluates all candidate (lab, slot) pairs satisfying capacity and availability.
    - Selects the laboratory with the smallest sufficient capacity, thus minimizing
      unused computer seats (lab.capacity - req.computers_required).
    - Uses deterministic tie-breaking:
        1. Smallest unused seats
        2. Time slot alphabetical order
        3. Laboratory name alphabetical order
    - Prioritizes maximizing scheduled requests before minimizing unused seats.
    """
    start_time = time.perf_counter()

    labs_dict = {lab["id"]: lab for lab in laboratories}
    reqs_dict = {req["id"]: req for req in requests}

    booked_slots = set()
    allocations = []
    unallocated = []

    # Process requests in deterministic order
    for req in requests:
        req_id = req["id"]
        req_code = req["request_code"]
        needed_seats = req["computers_required"]
        allowed_slots = req["allowed_slots"]

        # Gather all feasible options
        candidates = []
        for lab in laboratories:
            lab_id = lab["id"]
            cap = lab["capacity"]
            avail_slots = lab["available_slots"]

            if cap < needed_seats:
                continue

            for slot in allowed_slots:
                if slot not in avail_slots:
                    continue
                if (lab_id, slot) in booked_slots:
                    continue

                unused = cap - needed_seats
                candidates.append({
                    "laboratory": lab,
                    "slot": slot,
                    "unused_seats": unused
                })

        if not candidates:
            unallocated.append({
                "request_id": req_id,
                "request_code": req_code,
                "department_name": req.get("department_name", "N/A"),
                "computers_required": needed_seats,
                "allowed_slots": allowed_slots,
                "reason": "No feasible lab with sufficient capacity was open in the requested time slots."
            })
            continue

        # Best Fit Selection: Sort candidates by:
        # 1. unused_seats (ascending) -> minimizes wasted seats
        # 2. slot name (ascending) -> deterministic tie-break
        # 3. lab_name (ascending) -> deterministic tie-break
        candidates.sort(key=lambda c: (
            c["unused_seats"],
            c["slot"],
            c["laboratory"]["lab_name"]
        ))

        chosen = candidates[0]
        chosen_lab = chosen["laboratory"]
        chosen_slot = chosen["slot"]
        unused_seats = chosen["unused_seats"]

        booked_slots.add((chosen_lab["id"], chosen_slot))
        allocations.append({
            "request_id": req_id,
            "request_code": req_code,
            "department_name": req.get("department_name", "N/A"),
            "laboratory_id": chosen_lab["id"],
            "lab_name": chosen_lab["lab_name"],
            "time_slot": chosen_slot,
            "computers_required": needed_seats,
            "capacity": chosen_lab["capacity"],
            "unused_seats": unused_seats,
            "algorithm_name": "BEST_FIT"
        })

    end_time = time.perf_counter()
    runtime_ms = round((end_time - start_time) * 1000, 4)

    is_valid, conflicts, error_messages = validate_schedule(allocations, labs_dict, reqs_dict)

    scheduled_count = len(allocations)
    unallocated_count = len(unallocated)
    total_unused_seats = sum(a["unused_seats"] for a in allocations)
    total_reqs = scheduled_count + unallocated_count
    scheduling_percentage = round((scheduled_count / total_reqs * 100), 2) if total_reqs > 0 else 0.0

    return {
        "algorithm_name": "BEST_FIT",
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

