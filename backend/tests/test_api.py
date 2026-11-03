import pytest
from fastapi.testclient import TestClient
from app.main import app, init_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_api_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "version" in data

def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@campuslab.edu",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@campuslab.edu"

def test_get_laboratories(client):
    response = client.get("/api/labs")
    assert response.status_code == 200
    labs = response.json()
    assert len(labs) >= 4
    lab_names = [l["lab_name"] for l in labs]
    assert "Lab A" in lab_names
    assert "Lab B" in lab_names

def test_get_departments(client):
    response = client.get("/api/departments")
    assert response.status_code == 200
    depts = response.json()
    assert len(depts) >= 5
    dept_names = [d["department_name"] for d in depts]
    assert "CSE" in dept_names

def test_get_requests(client):
    response = client.get("/api/requests")
    assert response.status_code == 200
    reqs = response.json()
    assert len(reqs) >= 5
    req_codes = [r["request_code"] for r in reqs]
    assert "R1" in req_codes

def test_schedule_fcfs_endpoint(client):
    response = client.post("/api/schedule/fcfs")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm_name"] == "FCFS"
    assert data["conflicts"] == 0
    assert "allocations" in data
    assert "matrix" in data

def test_schedule_best_fit_endpoint(client):
    response = client.post("/api/schedule/best-fit")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm_name"] == "BEST_FIT"
    assert data["conflicts"] == 0
    assert len(data["allocations"]) == 5

def test_schedule_or_tools_endpoint(client):
    response = client.post("/api/schedule/or-tools?time_limit_seconds=5.0")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm_name"] == "OR_TOOLS"
    assert data["solver_status"] in ("OPTIMAL", "FEASIBLE")
    assert data["conflicts"] == 0
    assert len(data["allocations"]) == 5
    assert data["total_unused_seats"] <= 20

def test_analytics_dashboard_endpoint(client):
    response = client.get("/api/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["total_laboratories"] >= 4
    assert data["total_requests"] >= 5
    assert "lab_utilization" in data
    assert "slot_usage" in data

def test_analytics_comparison_endpoint(client):
    response = client.get("/api/analytics/comparison")
    assert response.status_code == 200
    data = response.json()
    assert "fcfs" in data
    assert "best_fit" in data
    assert len(data["metrics"]) > 0

def test_reschedule_simulate_endpoint(client):
    payload = {
        "unavailable_lab_name": "Lab A",
        "unavailable_slot": "S2",
        "base_algorithm": "BEST_FIT"
    }
    response = client.post("/api/reschedule/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["unavailable_lab_name"] == "Lab A"
    assert data["unavailable_slot"] == "S2"
    assert "old_allocations" in data
    assert "new_allocations" in data
    assert "assignments_changed_count" in data

def test_reports_export_csv(client):
    response = client.get("/api/reports/export-csv?algorithm=BEST_FIT")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Request Code" in response.text
