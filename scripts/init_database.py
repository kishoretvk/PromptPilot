#!/usr/bin/env python3
"""
Database Initialization Script for PromptPilot

This script initializes the database with tables and default data.
Run this script to set up the database for the first time.

Usage:
    python scripts/init_database.py
"""

import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    """Initialize the database"""
    print("🚀 Initializing PromptPilot Database...")
    print("=" * 50)

    try:
        # Import database initialization function
        from api.database import initialize_database

        # Initialize database
        success = initialize_database()

        if success:
            print("\n" + "=" * 50)
            print("🎉 Database initialization completed successfully!")
            print("\n📋 What's been created:")
            print("   ✅ All database tables")
            print("   ✅ Default admin user (username: admin, password: admin123)")
            print("   ✅ Default system settings")
            print("   ✅ Ollama provider configuration")
            print("\n🔗 Next steps:")
            print("   1. Start the API server: python -m api.rest")
            print("   2. Start the UI server: cd ui/dashboard && npm start")
            print("   3. Open http://localhost:3000 in your browser")
            print("   4. Login with username: admin, password: admin123")
            return 0
        else:
            print("\n❌ Database initialization failed!")
            return 1

    except ImportError as e:
        print(f"\n❌ Import error: {e}")
        print("Make sure you're running this from the project root directory")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
