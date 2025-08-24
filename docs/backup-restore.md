# Backup and Restore System

PromptPilot includes a comprehensive backup and restore system to protect your data and ensure business continuity.

## 📋 Overview

The backup system provides:
- Automated database backups
- Manual backup creation
- Point-in-time recovery
- Backup retention policies
- Cross-platform support (Linux/Mac/Windows)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │────│  Backup System   │────│   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Backup Scripts  │
                       └─────────────────┘
```

## 🚀 Setup

### Prerequisites
- Database (SQLite, PostgreSQL, MySQL)
- Appropriate database client tools
- Sufficient storage space
- Cron (Linux/Mac) or Task Scheduler (Windows) for automated backups

### Configuration
The backup system uses these environment variables:

```bash
# Database connection
DATABASE_URL=sqlite:///./data/promptpilot.db

# Backup settings
BACKUP_DIR=./backups
RETENTION_DAYS=30
```

## 🛠️ Commands

### Create Backup
Create a new backup manually:

```bash
# Linux/Mac
./scripts/backup_restore.sh backup

# Windows
scripts\backup_restore.bat backup
```

### Restore Backup
Restore from a specific backup:

```bash
# Linux/Mac
./scripts/backup_restore.sh restore backups/promptpilot_backup_20250823_103000.sql

# Windows
scripts\backup_restore.bat restore backups\promptpilot_backup_20250823_103000.sql
```

### List Backups
View available backups:

```bash
# Linux/Mac
./scripts/backup_restore.sh list

# Windows
scripts\backup_restore.bat list
```

## 📁 Backup Structure

### File Organization
Backups are stored in the `backups/` directory:

```
backups/
├── promptpilot_backup_20250823_103000.sql  # SQL dump
├── promptpilot_backup_20250823_103000.db   # Database file copy
├── promptpilot_backup_20250823_110000.sql
└── promptpilot_backup_20250823_110000.db
```

### Backup Contents
Each backup includes:
- Complete database schema
- All data tables
- Indexes and constraints
- Stored procedures and triggers (if applicable)

## 🔄 Automated Backups

### Linux/Mac (Cron)
Add to crontab for daily backups at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line
0 2 * * * cd /path/to/promptpilot && ./scripts/backup_restore.sh backup
```

### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to daily at 2 AM
4. Set action to run `scripts\backup_restore.bat backup`
5. Set working directory to PromptPilot root

### Docker Environment
For Docker deployments, use a separate backup container:

```yaml
version: '3.8'
services:
  backup:
    image: alpine
    volumes:
      - ./data:/data
      - ./backups:/backups
    command: |
      sh -c "
        apk add --no-cache sqlite
        sqlite3 /data/promptpilot.db .dump > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql
      "
    restart: unless-stopped
```

## 🗃️ Backup Strategies

### Full Backups
Complete database backup including:
- All tables and data
- Schema definitions
- Indexes and constraints
- User permissions

### Incremental Backups
Changes since last backup:
- Transaction logs
- Changed data pages
- Schema modifications

### Point-in-Time Recovery
Restore to specific timestamp:
- Base backup
- Transaction logs
- Replay transactions

## 🛡️ Security

### Encryption
Backups can be encrypted at rest:

```bash
# Encrypt backup
gpg --cipher-algo AES256 --symmetric backup.sql

# Decrypt backup
gpg --decrypt backup.sql.gpg > backup.sql
```

### Access Control
- Restrict backup directory permissions
- Use separate user accounts for backups
- Audit backup access logs

### Offsite Storage
Store backups in multiple locations:
- Local storage
- Cloud storage (AWS S3, Google Cloud Storage)
- Physical media

## 📏 Retention Policies

### Default Policy
- Keep daily backups for 7 days
- Keep weekly backups for 30 days
- Keep monthly backups for 1 year

### Custom Policies
Configure retention in backup script:

```bash
# Keep backups for 30 days
find $BACKUP_DIR -name "promptpilot_backup_*.sql" -mtime +30 -delete
```

### Archive Strategy
Move old backups to archive storage:

```bash
# Move 30+ day old backups to archive
find $BACKUP_DIR -name "promptpilot_backup_*.sql" -mtime +30 -exec mv {} $ARCHIVE_DIR \;
```

## 🧪 Testing

### Backup Verification
Verify backup integrity:

```bash
# Check SQL syntax
sqlite3 :memory: < backup.sql

# Compare row counts
sqlite3 database.db "SELECT count(*) FROM prompts;" > original_count.txt
sqlite3 :memory: < backup.sql
sqlite3 :memory: "SELECT count(*) FROM prompts;" > backup_count.txt
diff original_count.txt backup_count.txt
```

### Restore Testing
Regular restore testing:
1. Create test environment
2. Restore backup to test database
3. Verify data integrity
4. Run application tests
5. Document results

## 🚨 Recovery Procedures

### Complete Recovery
Restore entire database:

```bash
# Stop application
sudo systemctl stop promptpilot

# Restore backup
./scripts/backup_restore.sh restore backups/promptpilot_backup_20250823_103000.sql

# Start application
sudo systemctl start promptpilot
```

### Partial Recovery
Restore specific tables:

```bash
# Extract specific table from backup
grep -A 1000 "CREATE TABLE prompts" backup.sql | grep -B 1000 "CREATE TABLE pipelines" > prompts_backup.sql

# Restore specific table
sqlite3 database.db < prompts_backup.sql
```

### Point-in-Time Recovery
Restore to specific timestamp:

```bash
# Restore base backup
./scripts/backup_restore.sh restore backups/promptpilot_backup_20250823_000000.sql

# Apply transaction logs up to desired time
# (Implementation depends on database system)
```

## 📊 Monitoring

### Backup Status
Monitor backup success:

```bash
# Check last backup
ls -lt backups/ | head -5

# Check backup size
du -h backups/*.sql
```

### Health Checks
Verify backup system health:

```bash
# Test backup creation
./scripts/backup_restore.sh backup && echo "Backup successful"

# Test restore capability
# (Test on separate database to avoid data loss)
```

### Alerting
Set up alerts for:
- Failed backups
- Missing backups
- Low disk space
- Large backup sizes

## 🔄 Disaster Recovery

### Recovery Plan
Documented recovery procedures:
1. Assess damage
2. Identify latest good backup
3. Restore database
4. Validate data
5. Resume operations

### Business Continuity
Minimize downtime:
- Hot standby servers
- Load balancing
- Automated failover
- Regular DR tests

### Documentation
Maintain recovery documentation:
- Contact information
- System architecture
- Recovery procedures
- Test results

## 📈 Performance Considerations

### Backup Window
Schedule backups during low-traffic periods:
- Database locking
- I/O impact
- Network bandwidth

### Compression
Reduce backup size:

```bash
# Compress backup
gzip backup.sql

# Restore compressed backup
gunzip backup.sql.gz
```

### Parallel Processing
Speed up large backups:
- Parallel table dumps
- Multiple backup streams
- Distributed storage

## 🚫 Common Issues

### Backup Failures
Troubleshoot common issues:
- Insufficient disk space
- Database locks
- Permission errors
- Network issues

### Restore Failures
Address restore problems:
- Corrupted backups
- Schema mismatches
- Data inconsistencies
- Missing dependencies

### Performance Issues
Optimize backup performance:
- Incremental backups
- Compression
- Parallel processing
- Off-peak scheduling

## 📚 Further Reading

- [Database Backup Best Practices](https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/back-up-and-restore-of-sql-server-databases)
- [SQLite Backup Documentation](https://www.sqlite.org/backup.html)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [MySQL Backup Documentation](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)

## 🤝 Contributing

To contribute to the backup system:
1. Test backup/restore procedures thoroughly
2. Document new features
3. Follow security best practices
4. Optimize for performance