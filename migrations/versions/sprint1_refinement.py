"""Sprint 1 - Add indexes for refinement tables

Revision ID: sprint1_refinement
Revises: 1_initial_migration
Create Date: 2025-09-21

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'sprint1_refinement'
down_revision = '1_initial_migration'
branch_labels = None
depends_on = None


def upgrade():
    # Add indexes for QualityScore and AISuggestion
    op.create_index('ix_quality_scores_prompt_created', 'quality_scores', ['prompt_id', 'created_at'], unique=False)
    op.create_index('ix_ai_suggestions_prompt_type', 'ai_suggestions', ['prompt_id', 'suggestion_type'], unique=False)

def downgrade():
    # Remove indexes
    op.drop_index('ix_quality_scores_prompt_created', table_name='quality_scores')
    op.drop_index('ix_ai_suggestions_prompt_type', table_name='ai_suggestions')
