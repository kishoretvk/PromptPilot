# Database Migration System

PromptPilot uses Alembic for database migrations, providing a robust system for evolving the database schema over time.

## 📋 Overview

The migration system allows you to:
- Track database schema changes
- Apply migrations in a controlled manner
- Roll back changes when needed
- Maintain consistency across environments

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │────│    Alembic       │────│   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Migration Files │
                       └─────────────────┘
```

## 🚀 Setup

### Prerequisites
- Python 3.8+
- SQLAlchemy
- Alembic
- Database (SQLite, PostgreSQL, MySQL)

### Installation
The migration system is included in the requirements:

```bash
pip install -r requirements.txt
```

This installs Alembic and related dependencies.

### Configuration
The Alembic configuration is in `alembic.ini`:

```ini
[alembic]
script_location = migrations
sqlalchemy.url = sqlite:///./data/promptpilot.db
```

## 📁 Directory Structure

```
migrations/
├── env.py              # Migration environment
├── script.py.mako      # Migration script template
└── versions/           # Migration scripts
    ├── 1_initial_migration.py
    └── 2_add_indexes.py
```

## 🛠️ Commands

### Initialize Migration Repository
If starting from scratch:

```bash
alembic init migrations
```

### Create a New Migration
Generate a new migration script:

```bash
alembic revision -m "Add indexes to prompts table"
```

This creates a new file in `migrations/versions/` with upgrade and downgrade functions.

### Apply Migrations
Apply all pending migrations:

```bash
alembic upgrade head
```

Apply a specific migration:

```bash
alembic upgrade <revision_id>
```

### Rollback Migrations
Rollback to a previous state:

```bash
alembic downgrade -1  # Rollback one migration
alembic downgrade base  # Rollback all migrations
```

### View Migration History
List all migrations and their status:

```bash
alembic history
```

Show current revision:

```bash
alembic current
```

## 📝 Writing Migrations

### Basic Migration Structure
Each migration file has this structure:

```python
"""Add indexes to prompts table

Revision ID: 2_add_indexes
Revises: 1_initial_migration
Create Date: 2025-08-23 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '2_add_indexes'
down_revision = '1_initial_migration'
branch_labels = None
depends_on = None

def upgrade():
    # Add upgrade operations here
    op.create_index('ix_prompts_name', 'prompts', ['name'])

def downgrade():
    # Add downgrade operations here
    op.drop_index('ix_prompts_name', 'prompts')
```

### Common Operations

#### Creating Tables
```python
def upgrade():
    op.create_table('new_table',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
```

#### Modifying Columns
```python
def upgrade():
    op.add_column('prompts', sa.Column('new_field', sa.String(length=100)))
    op.alter_column('prompts', 'old_field', new_column_name='new_field')
```

#### Adding Indexes
```python
def upgrade():
    op.create_index('ix_prompts_status', 'prompts', ['status'])
```

#### Adding Foreign Keys
```python
def upgrade():
    op.create_foreign_key('fk_prompt_owner', 'prompts', 'users', ['owner_id'], ['id'])
```

## 🔄 Auto-generation

Alembic can auto-generate migrations based on model changes:

```bash
alembic revision --autogenerate -m "Add new fields"
```

This compares your SQLAlchemy models with the current database state and generates appropriate migration operations.

## 🧪 Testing Migrations

### Test Environment
Create a separate database for testing:

```bash
alembic -c alembic_test.ini upgrade head
```

### Migration Testing
1. Apply migrations to test database
2. Run application tests
3. Rollback migrations
4. Verify rollback success

## 🛡️ Best Practices

### 1. Always Write Downgrade Functions
Every upgrade operation should have a corresponding downgrade:

```python
def upgrade():
    op.add_column('prompts', sa.Column('description', sa.Text()))

def downgrade():
    op.drop_column('prompts', 'description')
```

### 2. Use Transactions
Wrap related operations in transactions:

```python
def upgrade():
    with op.batch_alter_table('prompts') as batch_op:
        batch_op.add_column(sa.Column('new_field', sa.String(50)))
        batch_op.create_index('ix_prompts_new_field', ['new_field'])
```

### 3. Test Migrations
Always test migrations in a development environment before applying to production.

### 4. Backup Before Migrating
Create a backup before applying migrations to production:

```bash
# SQLite backup
cp database.db database.db.backup

# PostgreSQL backup
pg_dump mydatabase > backup.sql
```

## 🚨 Common Issues

### Migration Conflicts
When multiple developers create migrations simultaneously:

1. Merge the migrations
2. Update the `down_revision` in the newer migration
3. Test the merged sequence

### Data Migration
For complex data transformations:

```python
def upgrade():
    # Schema change
    op.add_column('prompts', sa.Column('version', sa.String(20)))
    
    # Data migration
    connection = op.get_bind()
    connection.execute(
        "UPDATE prompts SET version = '1.0.0' WHERE version IS NULL"
    )
```

### Performance Considerations
For large tables, consider:

1. Adding indexes concurrently
2. Using batch operations
3. Scheduling migrations during low-traffic periods

## 📊 Monitoring

### Migration Status
Check migration status:

```bash
alembic current
alembic history --verbose
```

### Logging
Enable migration logging in `alembic.ini`:

```ini
[loggers]
keys = root,sqlalchemy,alembic

[logger_alembic]
level = INFO
handlers =
qualname = alembic
```

## 🔄 CI/CD Integration

### Automated Migration
In your deployment pipeline:

```bash
# Apply migrations
alembic upgrade head

# Start application
python -m api.rest
```

### Health Checks
Verify migration success:

```bash
alembic current | grep "head" && echo "Migrations up to date"
```

## 📚 Further Reading

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Database Migration Best Practices](https://flywaydb.org/documentation/concepts/migrations)

## 🤝 Contributing

To contribute to the migration system:
1. Follow the existing migration pattern
2. Write comprehensive upgrade/downgrade functions
3. Test migrations thoroughly
4. Document complex migrations