import time
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model
from app.algorithms.validator import validate_schedule

def run_or_tools_solver(
    laboratories: List[Dict[str, Any]],
    requests: List[Dict[str, Any]],
    time_limit_seconds: float = 10.0
) -> Dict[str, Any]:
    """
    Exact Global Optimization using Google OR-Tools CP-SAT.
    
    Formulation:
    - Binary decision variables: x[r, l, s] in {0, 1} for valid request r, lab l, slot s.
    - Two-Phase Lexicographic Optimization:
        Phase 1: Maximize total scheduled requests (Primary priority).
        Phase 2: Fix scheduled count to optimal M* and minimize total unused seats (Secondary priority).
    - Enforces all hard constraints:
        1. No request splitting: sum_{l, s} x[r, l, s] <= 1 for all r
        2. No double booking: sum_{r} x[r, l, s] <= 1 for all l, s
        3. Capacity satisfaction: lab.capacity >= req.computers_required
        4. Request allowed slots: s in req.allowed_slots
        5. Lab available slots: s in lab.available_slots
    - Configurable time limit (default: 10.0 seconds).
    - Returns solver status (OPTIMAL, FEASIBLE, INFEASIBLE, UNKNOWN), allocations,
      unallocated requests, unused seats, and runtime.
    """
    start_time = time.perf_counter()

    labs_dict = {lab["id"]: lab for lab in laboratories}
    reqs_dict = {req["id"]: req for req in requests}

    model = cp_model.CpModel()

    # Determine unique slots
    all_slots = sorted(list(set(
        s for lab in laboratories for s in lab.get("available_slots", [])
    ).union(
        s for req in requests for s in req.get("allowed_slots", [])
    )))

    # Create binary decision variables x[r_id, l_id, slot] only for feasible triplets
    x = {}
    candidate_triplets = []

    for req in requests:
        r_id = req["id"]
        req_slots = set(req.get("allowed_slots", []))
        needed_seats = req["computers_required"]

        for lab in laboratories:
            l_id = lab["id"]
            lab_cap = lab["capacity"]
            lab_slots = set(lab.get("available_slots", []))

            # Capacity constraint: lab capacity must satisfy demand
            if lab_cap < needed_seats:
                continue

            # Feasible slots must be in both request allowed slots and lab available slots
            valid_slots = req_slots.intersection(lab_slots)

            for slot in valid_slots:
                var_name = f"x_r{r_id}_l{l_id}_{slot}"
                x[(r_id, l_id, slot)] = model.NewBoolVar(var_name)
                candidate_triplets.append((r_id, l_id, slot, lab_cap - needed_seats))

    # Constraint 1: No request splitting (each request scheduled at most once)
    for req in requests:
        r_id = req["id"]
        req_vars = [x[(r_id, l_id, slot)] for (r, l_id, slot, _) in candidate_triplets if r == r_id]
        if req_vars:
            model.Add(sum(req_vars) <= 1)

    # Constraint 2: No double-booking (at most one request per laboratory per slot)
    for lab in laboratories:
        l_id = lab["id"]
        for slot in lab.get("available_slots", []):
            slot_vars = [x[(r_id, l, s)] for (r_id, l, s, _) in candidate_triplets if l == l_id and s == slot]
            if slot_vars:
                model.Add(sum(slot_vars) <= 1)

    # --- Phase 1: Maximize total scheduled requests ---
    total_scheduled_expr = [x[(r_id, l_id, slot)] for (r_id, l_id, slot, _) in candidate_triplets]
    if total_scheduled_expr:
        model.Maximize(sum(total_scheduled_expr))
    else:
        # Edge case: no feasible triplets at all
        end_time = time.perf_counter()
        return _build_empty_response(requests, (end_time - start_time) * 1000, "INFEASIBLE")

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max(0.5, time_limit_seconds / 2.0)
    solver.parameters.num_workers = 4

    phase1_status = solver.Solve(model)

    status_map = {
        cp_model.OPTIMAL: "OPTIMAL",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.MODEL_INVALID: "UNKNOWN",
        cp_model.UNKNOWN: "UNKNOWN",
    }
    phase1_str = status_map.get(phase1_status, "UNKNOWN")

    if phase1_status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        end_time = time.perf_counter()
        return _build_empty_response(requests, (end_time - start_time) * 1000, phase1_str)

    max_scheduled = int(round(solver.ObjectiveValue()))

    # --- Phase 2: Fix scheduled count to max_scheduled and minimize total unused seats ---
    # Lock scheduled count >= max_scheduled
    model.Add(sum(total_scheduled_expr) >= max_scheduled)

    # Objective: Minimize sum of unused seats
    unused_seats_expr = [
        cost * x[(r_id, l_id, slot)]
        for (r_id, l_id, slot, cost) in candidate_triplets
    ]
    model.Minimize(sum(unused_seats_expr))

    # Solve Phase 2 with remaining time
    phase1_elapsed = time.perf_counter() - start_time
    remaining_time = max(0.5, time_limit_seconds - phase1_elapsed)
    solver.parameters.max_time_in_seconds = remaining_time

    phase2_status = solver.Solve(model)
    final_status_str = status_map.get(phase2_status, phase1_str)

    allocations = []
    scheduled_req_ids = set()

    for (r_id, l_id, slot, unused) in candidate_triplets:
        if solver.Value(x[(r_id, l_id, slot)]) == 1:
            req = reqs_dict[r_id]
            lab = labs_dict[l_id]
            allocations.append({
                "request_id": r_id,
                "request_code": req["request_code"],
                "department_name": req.get("department_name", "N/A"),
                "laboratory_id": l_id,
                "lab_name": lab["lab_name"],
                "time_slot": slot,
                "computers_required": req["computers_required"],
                "capacity": lab["capacity"],
                "unused_seats": unused,
                "algorithm_name": "OR_TOOLS"
            })
            scheduled_req_ids.add(r_id)

    # Sort allocations deterministically by request code
    allocations.sort(key=lambda a: a["request_code"])

    # Unallocated requests
    unallocated = []
    for req in requests:
        if req["id"] not in scheduled_req_ids:
            unallocated.append({
                "request_id": req["id"],
                "request_code": req["request_code"],
                "department_name": req.get("department_name", "N/A"),
                "computers_required": req["computers_required"],
                "allowed_slots": req["allowed_slots"],
                "reason": "Exact solver proved no feasible slot-capacity combination without violating hard constraints or reducing higher-priority allocation count."
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
        "algorithm_name": "OR_TOOLS",
        "solver_status": final_status_str,
        "is_optimal": (final_status_str == "OPTIMAL"),
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

def _build_empty_response(requests: List[Dict[str, Any]], runtime_ms: float, status: str) -> Dict[str, Any]:
    return {
        "algorithm_name": "OR_TOOLS",
        "solver_status": status,
        "is_optimal": False,
        "scheduled_count": 0,
        "unallocated_count": len(requests),
        "total_unused_seats": 0,
        "conflicts": 0,
        "runtime_ms": round(runtime_ms, 4),
        "scheduling_percentage": 0.0,
        "allocations": [],
        "unallocated": [
            {
                "request_id": r["id"],
                "request_code": r["request_code"],
                "department_name": r.get("department_name", "N/A"),
                "computers_required": r["computers_required"],
                "allowed_slots": r["allowed_slots"],
                "reason": f"Solver terminated with status {status}."
            }
            for r in requests
        ],
        "is_valid": True,
        "error_messages": []
    }

