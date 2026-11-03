from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin", nullable=False)


class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True)
    lab_name = Column(String(100), unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    available_slots = Column(JSON, nullable=False, default=list)  # list of slot strings, e.g. ["S1", "S2"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    allocations = relationship("Allocation", back_populates="laboratory", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    department_name = Column(String(100), unique=True, index=True, nullable=False)

    requests = relationship("Request", back_populates="department", cascade="all, delete-orphan")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(50), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    computers_required = Column(Integer, nullable=False)
    allowed_slots = Column(JSON, nullable=False, default=list)  # list of slot strings, e.g. ["S1", "S2"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    department = relationship("Department", back_populates="requests")
    allocations = relationship("Allocation", back_populates="request", cascade="all, delete-orphan")


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id", ondelete="CASCADE"), nullable=False)
    laboratory_id = Column(Integer, ForeignKey("laboratories.id", ondelete="CASCADE"), nullable=False)
    time_slot = Column(String(20), nullable=False)
    algorithm_name = Column(String(50), nullable=False)
    unused_seats = Column(Integer, nullable=False)

    request = relationship("Request", back_populates="allocations")
    laboratory = relationship("Laboratory", back_populates="allocations")


class AlgorithmResult(Base):
    __tablename__ = "algorithm_results"

    id = Column(Integer, primary_key=True, index=True)
    algorithm_name = Column(String(50), nullable=False)
    scheduled_count = Column(Integer, nullable=False)
    unallocated_count = Column(Integer, nullable=False)
    total_unused_seats = Column(Integer, nullable=False)
    conflicts = Column(Integer, nullable=False, default=0)
    runtime_ms = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

