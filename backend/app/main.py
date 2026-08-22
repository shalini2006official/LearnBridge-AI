import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routes import auth, student, teacher, documents, aid, notes, ai
from app.rag.document_processor import reload_all_chunks_into_vector_store

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnbridge.main")

# Auto-create database tables on startup
logger.info("Syncing database schema models...")
Base.metadata.create_all(bind=engine)
logger.info("Database schema models synced.")

app = FastAPI(
    title="LearnBridge AI API",
    description="Adaptive Local-AI Tutoring & Personalized Learning Platform",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://learn-bridge-ai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(student.router, prefix="/api")
app.include_router(teacher.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(aid.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    logger.info("FastAPI application startup trigger.")
    # Reload existing document chunks from database into active vector index
    try:
        db = SessionLocal()
        reload_all_chunks_into_vector_store(db)
        db.close()
    except Exception as e:
        logger.error(f"Startup vector index reload failed: {e}")

@app.get("/")
def read_root():
    return {
        "app": "LearnBridge AI API",
        "status": "online",
        "mode": "Demo Enabled (SQLite/Ollama Auto-Switch)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
