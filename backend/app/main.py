import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base, SessionLocal
from app.services.seed_data import seed_database
from app.routes import auth, labs, departments, requests, scheduling, rescheduling, analytics, reports, seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("campus_lab_optimizer")

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_database(db, force=False)
            logger.info("Database initialized and verified.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

# Run initialization immediately on load
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Also verify on lifespan startup
    init_db()
    yield
    logger.info("Application shutting down...")

app = FastAPI(
    title="Campus Laboratory Allocation Optimizer",
    description="Intelligent computer lab allocation and dynamic rescheduling system for college departments. Final-Year Engineering Project for CODE CRACK 3.0.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(labs.router)
app.include_router(departments.router)
app.include_router(requests.router)
app.include_router(scheduling.router)
app.include_router(rescheduling.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(seed.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to the Campus Laboratory Allocation Optimizer API",
        "version": "1.0.0",
        "project": "CODE CRACK 3.0",
        "docs_url": "/docs",
        "status": "operational"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "campus-lab-optimizer-backend"}
