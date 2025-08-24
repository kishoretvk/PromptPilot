#!/bin/bash
# backup_restore.sh
# Database backup and restore utilities for PromptPilot

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="./data/promptpilot.db"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Function to create backup
backup() {
    echo "Creating backup of database..."
    
    # Create backup with timestamp
    BACKUP_FILE="$BACKUP_DIR/promptpilot_backup_$DATE.sql"
    
    # For SQLite, we can use the .dump command
    if [ -f "$DB_PATH" ]; then
        sqlite3 $DB_PATH .dump > $BACKUP_FILE
        echo "Backup created: $BACKUP_FILE"
        
        # Also create a copy of the database file
        cp $DB_PATH "$BACKUP_DIR/promptpilot_backup_$DATE.db"
        echo "Database file copied: $BACKUP_DIR/promptpilot_backup_$DATE.db"
    else
        echo "Error: Database file not found at $DB_PATH"
        exit 1
    fi
}

# Function to restore backup
restore() {
    if [ -z "$1" ]; then
        echo "Usage: restore <backup_file>"
        echo "Available backups:"
        ls -la $BACKUP_DIR/*.sql
        exit 1
    fi
    
    BACKUP_FILE=$1
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "Error: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    echo "Restoring database from $BACKUP_FILE..."
    
    # Stop any running services first
    echo "Stopping services..."
    # Add commands to stop services here
    
    # Restore the database
    sqlite3 $DB_PATH < $BACKUP_FILE
    
    echo "Database restored from $BACKUP_FILE"
    
    # Restart services
    echo "Restarting services..."
    # Add commands to start services here
}

# Function to list backups
list_backups() {
    echo "Available backups:"
    ls -la $BACKUP_DIR/
}

# Main script logic
case "$1" in
    backup)
        backup
        ;;
    restore)
        restore $2
        ;;
    list)
        list_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|list}"
        echo "  backup    - Create a new backup"
        echo "  restore   - Restore from a backup file"
        echo "  list      - List available backups"
        exit 1
        ;;
esac