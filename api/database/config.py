# Database Configuration and Session Management
# Handles database connections, sessions, and configuration

import os
from typing import Generator, Optional
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import structlog
from contextlib import contextmanager

logger = structlog.get_logger()

# Database URL from environment - use SQLite for testing/development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./promptpilot_test.db"  # Use SQLite for testing
)

# Connection pool settings
POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "10"))
MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "20"))
POOL_TIMEOUT = int(os.getenv("DATABASE_POOL_TIMEOUT", "30"))
POOL_RECYCLE = int(os.getenv("DATABASE_POOL_RECYCLE", "3600"))  # 1 hour

# Create database engine with connection pooling (SQLite compatible)
if "sqlite" in DATABASE_URL:
    # Use StaticPool for SQLite (single-threaded)
    from sqlalchemy.pool import StaticPool
    engine = create_engine(
        DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},  # Allow multi-threading
        pool_pre_ping=True,
        echo=os.getenv("DATABASE_ECHO", "false").lower() == "true",
        future=True,
    )
else:
    # Use QueuePool for PostgreSQL/MySQL
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=POOL_SIZE,
        max_overflow=MAX_OVERFLOW,
        pool_timeout=POOL_TIMEOUT,
        pool_recycle=POOL_RECYCLE,
        pool_pre_ping=True,
        echo=os.getenv("DATABASE_ECHO", "false").lower() == "true",
        future=True,
    )

# Configure SQLite for better performance (if using SQLite for development)
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Configure SQLite for better performance and safety."""
    if "sqlite" in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        # Enable foreign key constraints
        cursor.execute("PRAGMA foreign_keys=ON")
        # Set journal mode to WAL for better concurrency
        cursor.execute("PRAGMA journal_mode=WAL")
        # Set synchronous mode to NORMAL for better performance
        cursor.execute("PRAGMA synchronous=NORMAL")
        # Set cache size (negative value means KB)
        cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
        # Set temp store to memory
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Keep objects accessible after commit
)

# Base class for models
Base = declarative_base()

class DatabaseManager:
    """Manages database connections and operations."""
    
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
        self.logger = structlog.get_logger()
    
    def get_session(self) -> Generator[Session, None, None]:
        """Get a database session with automatic cleanup."""
        session = self.SessionLocal()
        try:
            yield session
        except Exception as e:
            self.logger.error("Database session error", error=str(e))
            session.rollback()
            raise
        finally:
            session.close()
    
    @contextmanager
    def get_session_context(self):
        """Context manager for database sessions."""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            self.logger.error("Database transaction error", error=str(e))
            session.rollback()
            raise
        finally:
            session.close()
    
    def create_tables(self):
        """Create all database tables."""
        try:
            from .models import Base
            Base.metadata.create_all(bind=self.engine)
            self.logger.info("Database tables created successfully")
        except Exception as e:
            self.logger.error("Failed to create database tables", error=str(e))
            raise
    
    def drop_tables(self):
        """Drop all database tables (use with caution!)."""
        try:
            from .models import Base
            Base.metadata.drop_all(bind=self.engine)
            self.logger.warning("All database tables dropped")
        except Exception as e:
            self.logger.error("Failed to drop database tables", error=str(e))
            raise
    
    def check_connection(self) -> bool:
        """Check if database connection is working."""
        try:
            with self.engine.connect() as connection:
                connection.execute("SELECT 1")
            self.logger.info("Database connection successful")
            return True
        except Exception as e:
            self.logger.error("Database connection failed", error=str(e))
            return False
    
    def get_connection_info(self) -> dict:
        """Get database connection information."""
        return {
            "url": str(self.engine.url).replace(self.engine.url.password, "***") if self.engine.url.password else str(self.engine.url),
            "pool_size": self.engine.pool.size(),
            "checked_in": self.engine.pool.checkedin(),
            "checked_out": self.engine.pool.checkedout(),
            "overflow": self.engine.pool.overflow(),
            "invalid": self.engine.pool.invalid(),
        }
    
    def execute_raw_sql(self, sql: str, params: Optional[dict] = None):
        """Execute raw SQL query."""
        try:
            with self.engine.connect() as connection:
                result = connection.execute(sql, params or {})
                return result.fetchall()
        except Exception as e:
            self.logger.error("Raw SQL execution failed", sql=sql, error=str(e))
            raise

# Global database manager instance
db_manager = DatabaseManager()

# Dependency for FastAPI
def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session in FastAPI endpoints."""
    return db_manager.get_session()

# Database health check
async def check_database_health() -> dict:
    """Check database health for health endpoints."""
    try:
        with db_manager.get_session_context() as session:
            # Test basic query
            result = session.execute("SELECT 1 as health_check")
            row = result.fetchone()
            
            if row and row.health_check == 1:
                connection_info = db_manager.get_connection_info()
                return {
                    "status": "healthy",
                    "connection_info": connection_info,
                    "timestamp": os.getenv("TZ", "UTC")
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": "Invalid query result",
                    "timestamp": os.getenv("TZ", "UTC")
                }
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": os.getenv("TZ", "UTC")
        }

# Database initialization
async def init_database():
    """Initialize database with tables and default data."""
    try:
        # Create tables
        db_manager.create_tables()
        
        # Initialize default data
        from ..core.default_data import DefaultDataInitializer
        from ..services.storage_service import DatabaseStorageService
        
        storage_service = DatabaseStorageService()
        initializer = DefaultDataInitializer(storage_service)
        
        results = await initializer.initialize_default_data()
        logger.info("Database initialized successfully", results=results)
        
        return results
    except Exception as e:
        logger.error("Database initialization failed", error=str(e))
        raise

# Database migration utilities
class MigrationManager:
    """Manages database migrations."""
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    def run_migrations(self):
        """Run Alembic migrations."""
        try:
            from alembic.config import Config
            from alembic import command
            
            # Create Alembic config
            alembic_cfg = Config("alembic.ini")
            
            # Run migrations
            command.upgrade(alembic_cfg, "head")
            self.logger.info("Database migrations completed successfully")
        except Exception as e:
            self.logger.error("Database migration failed", error=str(e))
            raise
    
    def create_migration(self, message: str):
        """Create a new migration."""
        try:
            from alembic.config import Config
            from alembic import command
            
            # Create Alembic config
            alembic_cfg = Config("alembic.ini")
            
            # Generate migration
            command.revision(alembic_cfg, message=message, autogenerate=True)
            self.logger.info("Migration created successfully", message=message)
        except Exception as e:
            self.logger.error("Migration creation failed", error=str(e))
            raise
    
    def get_current_revision(self) -> Optional[str]:
        """Get current database revision."""
        try:
            from alembic.runtime.migration import MigrationContext
            
            with db_manager.engine.connect() as connection:
                context = MigrationContext.configure(connection)
                return context.get_current_revision()
        except Exception as e:
            self.logger.error("Failed to get current revision", error=str(e))
            return None
    
    def get_migration_history(self) -> list:
        """Get migration history."""
        try:
            from alembic.config import Config
            from alembic import command
            from io import StringIO
            
            # Create Alembic config
            alembic_cfg = Config("alembic.ini")
            
            # Capture history output
            output = StringIO()
            alembic_cfg.stdout = output
            
            command.history(alembic_cfg)
            
            return output.getvalue().split('\n')
        except Exception as e:
            self.logger.error("Failed to get migration history", error=str(e))
            return []

# Global migration manager
migration_manager = MigrationManager()

# Connection monitoring
class ConnectionMonitor:
    """Monitors database connections and performance."""
    
    def __init__(self):
        self.logger = structlog.get_logger()
    
    def get_pool_status(self) -> dict:
        """Get connection pool status."""
        try:
            pool = db_manager.engine.pool
            return {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "invalid": pool.invalid(),
                "total_connections": pool.size() + pool.overflow(),
                "available_connections": pool.checkedin(),
                "utilization": (pool.checkedout() / (pool.size() + pool.overflow())) * 100
            }
        except Exception as e:
            self.logger.error("Failed to get pool status", error=str(e))
            return {}
    
    def get_connection_metrics(self) -> dict:
        """Get connection metrics for monitoring."""
        try:
            pool_status = self.get_pool_status()
            
            return {
                "database_connections_total": pool_status.get("total_connections", 0),
                "database_connections_active": pool_status.get("checked_out", 0),
                "database_connections_idle": pool_status.get("checked_in", 0),
                "database_connections_utilization": pool_status.get("utilization", 0),
                "database_pool_overflow": pool_status.get("overflow", 0),
                "database_pool_invalid": pool_status.get("invalid", 0),
            }
        except Exception as e:
            self.logger.error("Failed to get connection metrics", error=str(e))
            return {}

# Global connection monitor
connection_monitor = ConnectionMonitor()


from api.config import Settings

settings = Settings()
