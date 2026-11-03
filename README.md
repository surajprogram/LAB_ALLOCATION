# Campus Laboratory Allocation Optimizer 🎓💻

**A Final-Year Engineering Project for CODE CRACK 3.0**

---

## 📌 1. Project Overview

The **Campus Laboratory Allocation Optimizer** is an intelligent full-stack decision-support system designed for university campuses. It automates the allocation of shared computer laboratory facilities across different academic departments while satisfying capacity constraints, avoiding double-bookings, respecting allowed time slots, and dynamically recovering from unexpected laboratory outages.

### Primary Objectives:
1. **Maximize Scheduled Department Requests** (Primary Priority)
2. **Minimize Total Unused Computer Seats** (Secondary Priority)
3. **Prevent Laboratory Double-Booking** (Zero hard conflicts)
4. **Enforce Laboratory Capacity Thresholds**
5. **Strictly Respect Department-Allowed and Laboratory-Available Time Slots**
6. **Support Real-Time Dynamic Rescheduling** across all three algorithms
7. **Empirically Compare FCFS, Greedy Best Fit, and Google OR-Tools CP-SAT**

---

## 🛠️ 2. Technology Stack

### Frontend
- **Framework:** React.js 19 with Vite
- **Styling:** Tailwind CSS (Modern Navy & Slate SaaS Dashboard Design)
- **Routing:** React Router v7
- **HTTP Client:** Axios (with automatic Bearer JWT interceptor)
- **Data Visualization:** Recharts (Interactive bar, pie, and metric charts)
- **Icons:** Lucide React

### Backend
- **Language:** Python 3.12
- **Framework:** FastAPI (RESTful API architecture with OpenAPI/Swagger docs)
- **Optimization Engine:** Google OR-Tools CP-SAT (`ortools.sat.python.cp_model`)
- **ORM:** SQLAlchemy 2.0
- **Validation:** Pydantic v2
- **Security:** Native bcrypt password hashing & JSON Web Tokens (PyJWT)
- **Testing:** Pytest (18 automated unit & integration tests)

### Database
- **Primary Database:** PostgreSQL 18+ (using psycopg2 driver)
- **Connection String:** `postgresql+psycopg2://postgres:Suraj%402005@localhost:5432/campus_lab_optimizer`
- *(Graceful local SQLite fallback is enabled for offline/isolated environments)*

---

## 📐 3. Mathematical & Algorithmic Formulation

### Exact Constraint Programming Model
Let:
- $\mathcal{R}$ be the set of requests, where each request $r \in \mathcal{R}$ requires $c_r$ computers and has allowed slots $S_r \subseteq \mathcal{S}$.
- $\mathcal{L}$ be the set of laboratories, where each laboratory $l \in \mathcal{L}$ has seat capacity $C_l$ and available slots $A_l \subseteq \mathcal{S}$.
- $\mathcal{S}$ be the finite set of operational time slots (e.g. $\{S1, S2, S3\}$).
- $x_{r, l, s} \in \{0, 1\}$ be the binary decision variable indicating whether request $r$ is allocated to laboratory $l$ during time slot $s$.

### Hard Constraints:
1. **Non-Splitting Constraint:** A request cannot be split across multiple labs:
   $$\sum_{l \in \mathcal{L}} \sum_{s \in \mathcal{S}} x_{r, l, s} \le 1 \quad \forall r \in \mathcal{R}$$

2. **No Double-Booking Constraint:** At most one request per laboratory per slot:
   $$\sum_{r \in \mathcal{R}} x_{r, l, s} \le 1 \quad \forall l \in \mathcal{L}, \forall s \in \mathcal{S}$$

3. **Capacity Constraint:** Allocated lab capacity must satisfy demand:
   $$x_{r, l, s} = 1 \implies C_l \ge c_r$$

4. **Slot Validity Constraints:**
   $$x_{r, l, s} = 1 \implies s \in S_r \cap A_l$$

---

## 🔬 4. Three Scheduling Algorithms

### A. FCFS (First Come First Served)
- Evaluates requests sequentially in their arrival order ($R1 \rightarrow R2 \rightarrow \dots$).
- Scans available laboratories and allowed slots in deterministic order.
- Allocates the first valid $(l, s)$ pair that fulfills capacity and availability without conflicts.
- Time complexity: $O(|\mathcal{R}| \cdot |\mathcal{L}| \cdot |\mathcal{S}|)$.

### B. Greedy Best Fit
- Evaluates all feasible $(l, s)$ combinations for each request.
- Selects the laboratory with the smallest sufficient capacity:
  $$\min_{(l, s) \text{ feasible}} (C_l - c_r)$$
- Uses deterministic tie-breaking based on:
  1. Smallest unused seats
  2. Earliest time slot name
  3. Laboratory name alphabetically
- Time complexity: $O(|\mathcal{R}| \cdot |\mathcal{L}| \cdot |\mathcal{S}| \log(|\mathcal{L}| \cdot |\mathcal{S}|))$.

### C. Google OR-Tools CP-SAT (Exact Global Optimizer)
- Employs **Two-Phase Lexicographic Optimization**:
  - **Phase 1 (Primary Priority):** Maximize total scheduled requests:
    $$\text{Objective 1:} \quad \max \sum_{r, l, s} x_{r, l, s}$$
    Let the optimal scheduled count be $M^*$.
  - **Phase 2 (Secondary Priority):** Fix the maximum scheduled count:
    $$\sum_{r, l, s} x_{r, l, s} \ge M^*$$
    and minimize total unused computer seats:
    $$\text{Objective 2:} \quad \min \sum_{r, l, s} (C_l - c_r) \cdot x_{r, l, s}$$
- **Solver Statuses:** Returns `OPTIMAL`, `FEASIBLE`, `INFEASIBLE`, or `UNKNOWN`.
- **Configurable Timeout:** `time_limit_seconds` (default: 10s).
- **Documented Solver Limitations:** The general multi-resource laboratory allocation problem is NP-complete. For campus instances with hundreds or thousands of requests, solving to proven optimality can exceed polynomial time. The configurable timeout ensures practical real-time execution by returning the best proven `FEASIBLE` solution if the time budget expires before exhaustive proof of optimality.

---

## 📊 5. Exact Dataset & Benchmark Results

### Input Laboratories
- **Lab A:** Capacity = 60, Slots = [S1, S2, S3]
- **Lab B:** Capacity = 40, Slots = [S1, S2, S3]
- **Lab C:** Capacity = 50, Slots = [S1, S2]
- **Lab D:** Capacity = 30, Slots = [S2, S3]

### Input Department Requests
- **R1:** CSE, Computers Required = 55, Allowed Slots = [S1, S2]
- **R2:** IT, Computers Required = 35, Allowed Slots = [S1]
- **R3:** AI & DS, Computers Required = 45, Allowed Slots = [S2]
- **R4:** ECE, Computers Required = 25, Allowed Slots = [S2, S3]
- **R5:** MCA, Computers Required = 40, Allowed Slots = [S3]

### Empirical Comparison Summary

| Metric | FCFS | Greedy Best Fit | Google OR-Tools CP-SAT | Winner / Verdict |
| :--- | :---: | :---: | :---: | :---: |
| **Scheduled Requests** | 5 / 5 (100%) | 5 / 5 (100%) | **5 / 5 (100%)** | **Tie (100% Demand Met)** |
| **Unallocated Requests** | 0 | 0 | **0** | **0 Unscheduled** |
| **Total Unused Seats** | 55 seats | 20 seats | **20 seats** | 🏆 **OR-Tools & Best Fit (-35 seats)** |
| **Hard Conflicts** | **0** | **0** | **0** | **Zero Conflicts Guaranteed** |
| **Execution Runtime** | ~0.15 ms | ~0.25 ms | ~15 ms | FCFS (Fastest Heuristic) |
| **Optimality Guarantee** | No | No (Heuristic) | **Mathematical Proof** | 🏆 **OR-Tools CP-SAT (OPTIMAL)** |

---

## 🔄 6. Dynamic Rescheduling Workflow

**Scenario:** *Lab A becomes unavailable in slot S2.*
1. Target lab's availability is updated ($S2$ removed from Lab A).
2. The rescheduler inspects existing allocations:
   - Valid allocations on other labs/slots are preserved (minimal churn).
   - Affected requests are reallocated using the selected base algorithm (`OR_TOOLS`, `BEST_FIT`, or `FCFS`).
3. System outputs:
   - Original schedule vs Rescheduled schedule side-by-side.
   - Total assignments changed count.
   - Any requests that could not be rescheduled (if capacity was insufficient).
   - Commit button to persist changes to PostgreSQL.

---

## 📁 7. Project Structure

```
Lap_allocation/
├── backend/
│   ├── app/
│   │   ├── algorithms/
│   │   │   ├── or_tools_solver.py # Google OR-Tools CP-SAT exact solver
│   │   │   ├── best_fit.py        # Best Fit heuristic engine
│   │   │   ├── fcfs.py            # FCFS algorithm engine
│   │   │   ├── rescheduler.py     # Dynamic rescheduling logic
│   │   │   └── validator.py       # Hard constraint validator
│   │   ├── routes/
│   │   │   ├── analytics.py       # Dashboard & 3-way comparative metrics
│   │   │   ├── auth.py            # JWT login and me endpoints
│   │   │   ├── departments.py     # Department CRUD
│   │   │   ├── labs.py            # Laboratory CRUD
│   │   │   ├── reports.py         # CSV export & print reports
│   │   │   ├── requests.py        # Demand request CRUD
│   │   │   ├── rescheduling.py    # Simulation & commit routes
│   │   │   ├── scheduling.py      # FCFS, Best Fit & OR-Tools triggers
│   │   │   └── seed.py            # Database seeding endpoint
│   │   ├── services/
│   │   │   └── seed_data.py       # Initial sample dataset population
│   │   ├── utils/
│   │   │   └── auth.py            # Bcrypt hashing & token decoding
│   │   ├── config.py              # Environment settings
│   │   ├── database.py            # SQLAlchemy PostgreSQL engine
│   │   ├── models.py              # Relational database models
│   │   ├── schemas.py             # Pydantic v2 schemas
│   │   └── main.py                # FastAPI application entry point
│   ├── tests/
│   │   ├── test_algorithms.py     # 3-Algorithm correctness & constraint tests
│   │   └── test_api.py            # FastAPI REST endpoint integration tests
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Modal, ConfirmDialog, StatCard, StatusBadge
│   │   │   └── layout/            # Navbar, Sidebar, AppLayout
│   │   ├── context/               # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/
│   │   │   ├── Comparison.jsx     # Page 7: 3-Algorithm Comparison
│   │   │   ├── Dashboard.jsx      # Page 2: Dashboard & 3-way Charts
│   │   │   ├── Departments.jsx    # Page 4: Department Management
│   │   │   ├── Labs.jsx           # Page 3: Lab Management
│   │   │   ├── Login.jsx          # Page 1: Admin Login
│   │   │   ├── Reports.jsx        # Page 9: Reports & CSV Export
│   │   │   ├── Requests.jsx       # Page 5: Request Management
│   │   │   ├── Rescheduling.jsx   # Page 8: Dynamic Rescheduling
│   │   │   └── ScheduleGenerator.jsx # Page 6: Multi-Engine Generator
│   │   ├── services/
│   │   │   └── api.js             # Axios API service
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 8. Execution & Setup Instructions

### Default Admin Credentials
- **Email:** `admin@campuslab.edu`
- **Password:** `admin123`

---

### Method A: Local Development Setup

#### 1. Backend Setup
```bash
cd backend

# Install Python dependencies (including ortools)
pip install -r requirements.txt

# Run automated tests (18 tests)
python -m pytest tests -v

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- FastAPI Backend: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`

#### 2. Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
- React Frontend Portal: `http://localhost:5173`

---

### 🧪 9. Automated Test Suite (18 Tests)

Run the full pytest suite:
```bash
cd backend
python -m pytest tests -v
```

All 18 test cases verify:
- FCFS constraint compliance & metrics calculation
- Best Fit capacity optimization & tie-breaking
- Google OR-Tools CP-SAT two-phase lexicographic optimality
- Dynamic rescheduling with OR-Tools, Best Fit, and FCFS
- Authentication & JWT token issuance
- All REST endpoints including `POST /api/schedule/or-tools`
- Dashboard analytics and CSV export generation
