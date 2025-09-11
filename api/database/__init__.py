# Database package initialization
from .config import (
    get_db, engine, db_manager, check_database_health,
    init_database, migration_manager, connection_monitor
)

# Alias for backward compatibility
async def init_db():
    """Initialize database (alias for init_database)"""
    return await init_database()

def test_db_connection():
    """Test database connection"""
    return db_manager.check_connection()

# Export all necessary functions
__all__ = [
    'get_db', 'engine', 'db_manager', 'check_database_health',
    'init_database', 'init_db', 'test_db_connection',
    'migration_manager', 'connection_monitor'
]
