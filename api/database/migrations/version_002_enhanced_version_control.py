"""
Migration script to enhance version control features
- Add merged_from_version_id and is_merge fields to prompt_versions table
"""

from sqlalchemy import Column, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

def upgrade(connection):
    """
    Upgrade the database schema
    """
    # Add merged_from_version_id column
    connection.execute("""
        ALTER TABLE prompt_versions 
        ADD COLUMN IF NOT EXISTS merged_from_version_id UUID REFERENCES prompt_versions(id)
    """)
    
    # Add is_merge column
    connection.execute("""
        ALTER TABLE prompt_versions 
        ADD COLUMN IF NOT EXISTS is_merge BOOLEAN DEFAULT FALSE
    """)
    
    # Create index for merged_from_version_id
    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_prompt_version_merge 
        ON prompt_versions(merged_from_version_id)
    """)

def downgrade(connection):
    """
    Downgrade the database schema
    """
    # Drop index
    connection.execute("""
        DROP INDEX IF EXISTS idx_prompt_version_merge
    """)
    
    # Drop columns
    connection.execute("""
        ALTER TABLE prompt_versions 
        DROP COLUMN IF EXISTS is_merge
    """)
    
    connection.execute("""
        ALTER TABLE prompt_versions 
        DROP COLUMN IF EXISTS merged_from_version_id
    """)