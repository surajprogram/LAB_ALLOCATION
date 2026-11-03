from typing import List, Dict, Any, Tuple

def validate_schedule(
    allocations: List[Dict[str, Any]],
    labs_dict: Dict[int, Dict[str, Any]],
    requests_dict: Dict[int, Dict[str, Any]]
) -> Tuple[bool, int, List[str]]:
    """
    Validates hard constraints for a set of allocations.
    Returns (is_valid, conflict_count, conflict_messages).
    
    Hard constraints:
    1. A request cannot be split across multiple laboratories.
    2. A laboratory can host only one request per time slot (no double-booking).
    3. Laboratory capacity must be >= requested computers.
    4. Only allowed time slots can be used by the request.
    5. Only available laboratory slots can be used.
    6. Each request scheduled at most once.
    """
    conflicts = 0
    errors = []

    # Check 1 & 6: Each request scheduled at most once
    scheduled_requests = set()
    for alloc in allocations:
        req_id = alloc["request_id"]
        if req_id in scheduled_requests:
            conflicts += 1
            errors.append(f"Request ID {req_id} ({alloc.get('request_code', '')}) is scheduled more than once.")
        scheduled_requests.add(req_id)

    # Check 2: A laboratory can host only one request per time slot
    lab_slot_booked = set()
    for alloc in allocations:
        lab_id = alloc["laboratory_id"]
        slot = alloc["time_slot"]
        key = (lab_id, slot)
        if key in lab_slot_booked:
            conflicts += 1
            errors.append(f"Laboratory ID {lab_id} is double-booked for time slot {slot}.")
        lab_slot_booked.add(key)

    # Check 3, 4, 5: Capacity, allowed slot, lab available slot
    for alloc in allocations:
        req_id = alloc["request_id"]
        lab_id = alloc["laboratory_id"]
        slot = alloc["time_slot"]

        req = requests_dict.get(req_id)
        lab = labs_dict.get(lab_id)

        if not req:
            conflicts += 1
            errors.append(f"Unknown Request ID {req_id} in allocation.")
            continue
        if not lab:
            conflicts += 1
            errors.append(f"Unknown Laboratory ID {lab_id} in allocation.")
            continue

        # Check capacity
        if lab["capacity"] < req["computers_required"]:
            conflicts += 1
            errors.append(
                f"Capacity violation: {lab['lab_name']} (cap: {lab['capacity']}) < "
                f"{req['request_code']} requirement ({req['computers_required']})."
            )

        # Check allowed slots
        if slot not in req.get("allowed_slots", []):
            conflicts += 1
            errors.append(
                f"Slot violation: Slot {slot} is not in allowed slots {req.get('allowed_slots')} "
                f"for request {req['request_code']}."
            )

        # Check available lab slots
        if slot not in lab.get("available_slots", []):
            conflicts += 1
            errors.append(
                f"Availability violation: Slot {slot} is not available in {lab['lab_name']} "
                f"available slots {lab.get('available_slots')}."
            )

    is_valid = (conflicts == 0)
    return is_valid, conflicts, errors

