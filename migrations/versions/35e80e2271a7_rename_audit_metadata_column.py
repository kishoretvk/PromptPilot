"""rename audit metadata column

Revision ID: 35e80e2271a7
Revises: 1_initial_migration
Create Date: 2025-09-09 20:31:25.476104

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '35e80e2271a7'
down_revision = '1_initial_migration'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('audit_logs', 'metadata', new_column_name='audit_metadata', existing_type=sa.JSON)


def downgrade() -> None:
    op.alter_column('audit_logs', 'audit_metadata', new_column_name='metadata', existing_type=sa.JSON)
