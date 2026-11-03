from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Any
from datetime import datetime

# --- Auth Schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- Laboratory Schemas ---
class LabBase(BaseModel):
    lab_name: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(..., gt=0)
    available_slots: List[str] = Field(...)

class LabCreate(LabBase):
    pass

class LabUpdate(BaseModel):
    lab_name: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    available_slots: Optional[List[str]] = None

class LabResponse(LabBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None


# --- Department Schemas ---
class DepartmentBase(BaseModel):
    department_name: str = Field(..., min_length=1, max_length=100)

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    department_name: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requests_count: Optional[int] = 0


# --- Request Schemas ---
class RequestBase(BaseModel):
    request_code: str = Field(..., min_length=1, max_length=50)
    department_id: int
    computers_required: int = Field(..., gt=0)
    allowed_slots: List[str] = Field(...)

class RequestCreate(RequestBase):
    pass

class RequestUpdate(BaseModel):
    request_code: Optional[str] = None
    department_id: Optional[int] = None
    computers_required: Optional[int] = Field(None, gt=0)
    allowed_slots: Optional[List[str]] = None

class RequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_code: str
    department_id: int
    department_name: Optional[str] = None
    computers_required: int
    allowed_slots: List[str]
    created_at: Optional[datetime] = None


# --- Allocation Schemas ---
class AllocationDetail(BaseModel):
    id: Optional[int] = None
    request_id: int
    request_code: str
    department_name: str
    laboratory_id: int
    lab_name: str
    time_slot: str
    computers_required: int
    capacity: int
    unused_seats: int
    algorithm_name: str

class UnallocatedDetail(BaseModel):
    request_id: int
    request_code: str
    department_name: str
    computers_required: int
    allowed_slots: List[str]
    reason: str

class ScheduleRunResponse(BaseModel):
    algorithm_name: str
    scheduled_count: int
    unallocated_count: int
    total_unused_seats: int
    conflicts: int
    runtime_ms: float
    scheduling_percentage: float
    solver_status: Optional[str] = None
    is_optimal: Optional[bool] = None
    allocations: List[AllocationDetail]
    unallocated: List[UnallocatedDetail]
    matrix: Optional[dict] = None

class AlgorithmResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    algorithm_name: str
    scheduled_count: int
    unallocated_count: int
    total_unused_seats: int
    conflicts: int
    runtime_ms: float
    created_at: Optional[datetime] = None


# --- Rescheduling Schemas ---
class RescheduleSimulateRequest(BaseModel):
    unavailable_lab_name: str
    unavailable_slot: str
    base_algorithm: str = "BEST_FIT"

class RescheduleCommitRequest(RescheduleSimulateRequest):
    pass

class RescheduleDiffResponse(BaseModel):
    unavailable_lab_name: str
    unavailable_slot: str
    base_algorithm: str
    original_scheduled_count: int
    new_scheduled_count: int
    assignments_changed_count: int
    unrescheduled_requests: List[UnallocatedDetail]
    old_allocations: List[AllocationDetail]
    new_allocations: List[AllocationDetail]
    message: str


# --- Analytics & Dashboard Schemas ---
class DashboardStats(BaseModel):
    total_laboratories: int
    total_departments: int
    total_requests: int
    scheduled_sessions: int
    unallocated_sessions: int
    total_unused_seats: int
    fcfs_result: Optional[ScheduleRunResponse] = None
    best_fit_result: Optional[ScheduleRunResponse] = None
    or_tools_result: Optional[ScheduleRunResponse] = None
    lab_utilization: List[dict]
    slot_usage: List[dict]
