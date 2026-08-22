from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnbridge.database")

db_url = settings.DATABASE_URL
engine = None

if db_url.startswith("sqlite"):
    logger.info("Initializing SQLite database engine.")
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    try:
        logger.info(f"Connecting to database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
        engine = create_engine(db_url)
        # Attempt connection to verify PostgreSQL is up
        with engine.connect() as connection:
            logger.info("Successfully connected to PostgreSQL database.")
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {e}. Falling back to SQLite database.")
        db_url = "sqlite:///./learnbridge.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
