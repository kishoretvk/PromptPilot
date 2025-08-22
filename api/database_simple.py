from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from typing import Generator
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./promptpilot.db"
)

logger.info(f"Using database: {DATABASE_URL}")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=0,
        pool_pre_ping=True,
        pool_recycle=3600,
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()

def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    try:
        logger.info("Initializing database...")
        
        # Create all tables (will be empty for now)
        Base.metadata.create_all(bind=engine)
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        # Don't raise, just log the error

def test_db_connection():
    """Test database connection"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            return result.fetchone() is not None
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

def close_db_connections():
    """Close all database connections"""
    try:
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")

# Mock user for development
class MockUser:
    def __init__(self):
        self.id = "dev-user-123"
        self.username = "dev"
        self.email = "dev@promptpilot.com"
        self.is_active = True

def get_current_user():
    """Mock current user for development"""
    return MockUser()