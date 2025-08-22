from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from typing import Generator
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    \"DATABASE_URL\", 
    \"postgresql://promptpilot:promptpilot@localhost:5432/promptpilot\"
)

# For development, fallback to SQLite
if \"sqlite\" not in DATABASE_URL and not os.getenv(\"POSTGRES_AVAILABLE\"):
    DATABASE_URL = \"sqlite:///./promptpilot.db\"
    logger.warning(\"Using SQLite database for development\")

# Create engine
if DATABASE_URL.startswith(\"sqlite\"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={\"check_same_thread\": False},
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
    \"\"\"Dependency to get database session\"\"\"
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f\"Database session error: {e}\")
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    \"\"\"Initialize database tables\"\"\"
    try:
        # Import all models to ensure they are registered with SQLAlchemy
        from . import models
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        logger.info(\"Database initialized successfully\")
        
        # Create default admin user if not exists
        create_default_admin_user()
        
    except Exception as e:
        logger.error(f\"Database initialization failed: {e}\")
        raise

def create_default_admin_user():
    \"\"\"Create default admin user for initial setup\"\"\"
    try:
        from .models import User
        from .auth import get_password_hash
        
        db = SessionLocal()
        
        # Check if admin user exists
        admin_user = db.query(User).filter(User.username == \"admin\").first()
        
        if not admin_user:
            admin_user = User(
                username=\"admin\",
                email=\"admin@promptpilot.com\",
                hashed_password=get_password_hash(\"admin123\"),
                is_active=True,
                is_superuser=True,
                created_at=datetime.utcnow()
            )
            
            db.add(admin_user)
            db.commit()
            
            logger.info(\"Default admin user created (username: admin, password: admin123)\")
        
        db.close()
        
    except Exception as e:
        logger.error(f\"Failed to create default admin user: {e}\")

def test_db_connection():
    \"\"\"Test database connection\"\"\"
    try:
        with engine.connect() as connection:
            result = connection.execute(\"SELECT 1\")
            return result.fetchone() is not None
    except Exception as e:
        logger.error(f\"Database connection test failed: {e}\")
        return False

def close_db_connections():
    \"\"\"Close all database connections\"\"\"
    try:
        engine.dispose()
        logger.info(\"Database connections closed\")
    except Exception as e:
        logger.error(f\"Error closing database connections: {e}\")