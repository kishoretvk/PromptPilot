@echo off
REM backup_restore.bat
REM Database backup and restore utilities for PromptPilot (Windows)

REM Configuration
set BACKUP_DIR=./backups
set DB_PATH=./data/promptpilot.db

REM Get timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set DATE=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,2%%dt:~10,2%%dt:~12,2%

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Function to create backup
if "%1"=="backup" (
    echo Creating backup of database...
    
    REM Create backup with timestamp
    set BACKUP_FILE=%BACKUP_DIR%\promptpilot_backup_%DATE%.sql
    
    REM For SQLite, we can use the .dump command
    if exist "%DB_PATH%" (
        echo .dump | sqlite3 %DB_PATH% > %BACKUP_FILE%
        echo Backup created: %BACKUP_FILE%
        
        REM Also create a copy of the database file
        copy %DB_PATH% %BACKUP_DIR%\promptpilot_backup_%DATE%.db
        echo Database file copied: %BACKUP_DIR%\promptpilot_backup_%DATE%.db
    ) else (
        echo Error: Database file not found at %DB_PATH%
        exit /b 1
    )
    goto :eof
)

REM Function to restore backup
if "%1"=="restore" (
    if "%2"=="" (
        echo Usage: backup_restore.bat restore ^<backup_file^>
        echo Available backups:
        dir %BACKUP_DIR%\*.sql
        exit /b 1
    )
    
    set BACKUP_FILE=%2
    
    if not exist "%BACKUP_FILE%" (
        echo Error: Backup file not found: %BACKUP_FILE%
        exit /b 1
    )
    
    echo Restoring database from %BACKUP_FILE%...
    
    REM Stop any running services first
    echo Stopping services...
    REM Add commands to stop services here
    
    REM Restore the database
    sqlite3 %DB_PATH% < %BACKUP_FILE%
    
    echo Database restored from %BACKUP_FILE%
    
    REM Restart services
    echo Restarting services...
    REM Add commands to start services here
    goto :eof
)

REM Function to list backups
if "%1"=="list" (
    echo Available backups:
    dir %BACKUP_DIR%\
    goto :eof
)

REM Main script logic
echo Usage: backup_restore.bat {backup^|restore^|list}
echo   backup    - Create a new backup
echo   restore   - Restore from a backup file
echo   list      - List available backups
exit /b 1