from sqlalchemy.orm import Session
from app.models import User, Laboratory, Department, Request, Allocation, AlgorithmResult
from app.utils.auth import get_password_hash
from app.config import settings

def seed_database(db: Session, force: bool = False):
    """
    Seeds the database with default administrator and the exact sample dataset
    from the problem specification.
    """
    if force:
        # Clear allocations, requests, labs, departments
        db.query(Allocation).delete()
        db.query(AlgorithmResult).delete()
        db.query(Request).delete()
        db.query(Department).delete()
        db.query(Laboratory).delete()
        db.commit()

    # 1. Seed Admin User
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            name=settings.ADMIN_NAME,
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            role="admin"
        )
        db.add(admin)
        db.commit()

    # If labs already exist and not forced, return
    if db.query(Laboratory).count() > 0 and not force:
        return

    # 2. Seed Sample Laboratories
    sample_labs = [
        {"lab_name": "Lab A", "capacity": 60, "available_slots": ["S1", "S2", "S3"]},
        {"lab_name": "Lab B", "capacity": 40, "available_slots": ["S1", "S2", "S3"]},
        {"lab_name": "Lab C", "capacity": 50, "available_slots": ["S1", "S2"]},
        {"lab_name": "Lab D", "capacity": 30, "available_slots": ["S2", "S3"]},
    ]

    lab_instances = {}
    for l_data in sample_labs:
        lab = db.query(Laboratory).filter(Laboratory.lab_name == l_data["lab_name"]).first()
        if not lab:
            lab = Laboratory(**l_data)
            db.add(lab)
            db.flush()
        lab_instances[l_data["lab_name"]] = lab

    # 3. Seed Sample Departments
    sample_depts = ["CSE", "IT", "AI & DS", "ECE", "MCA"]
    dept_instances = {}
    for d_name in sample_depts:
        dept = db.query(Department).filter(Department.department_name == d_name).first()
        if not dept:
            dept = Department(department_name=d_name)
            db.add(dept)
            db.flush()
        dept_instances[d_name] = dept

    # 4. Seed Sample Requests
    sample_requests = [
        {"request_code": "R1", "dept": "CSE", "computers_required": 55, "allowed_slots": ["S1", "S2"]},
        {"request_code": "R2", "dept": "IT", "computers_required": 35, "allowed_slots": ["S1"]},
        {"request_code": "R3", "dept": "AI & DS", "computers_required": 45, "allowed_slots": ["S2"]},
        {"request_code": "R4", "dept": "ECE", "computers_required": 25, "allowed_slots": ["S2", "S3"]},
        {"request_code": "R5", "dept": "MCA", "computers_required": 40, "allowed_slots": ["S3"]},
    ]

    for r_data in sample_requests:
        req = db.query(Request).filter(Request.request_code == r_data["request_code"]).first()
        if not req:
            dept = dept_instances.get(r_data["dept"])
            if dept:
                req = Request(
                    request_code=r_data["request_code"],
                    department_id=dept.id,
                    computers_required=r_data["computers_required"],
                    allowed_slots=r_data["allowed_slots"]
                )
                db.add(req)

    db.commit()

