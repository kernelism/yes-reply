#!/usr/bin/env python3
"""
Simple database initialization script for YesReply.
Creates all tables based on SQLAlchemy models.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, init_db
from app.db.base import Base
# Import all models to ensure they're registered with SQLAlchemy
from app.db.models import (
    User,
    LinkedInVerification,
    Email,
    Transaction,
    Payment,
    Cashout,
    Notification
)


def create_tables():
    """
    Create all database tables.
    This will only create tables that don't exist yet - it won't modify existing tables.
    """
    print("=" * 60)
    print("YesReply Database Initialization")
    print("=" * 60)
    print(f"Database URL: {engine.url}")
    print()
    
    try:
        # Test connection
        print("Testing database connection...")
        with engine.connect() as conn:
            print("✓ Successfully connected to database")
        
        # Create all tables
        print("\nCreating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✓ All tables created successfully")
        
        # List created tables
        print("\nTables in database:")
        tables = Base.metadata.tables.keys()
        for table_name in sorted(tables):
            print(f"  - {table_name}")
        
        print()
        print("=" * 60)
        print("Database initialization completed successfully!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error initializing database: {e}")
        print("\nPlease check:")
        print("  1. Your DATABASE_URL environment variable is correct")
        print("  2. The database server is running and accessible")
        print("  3. The database credentials are valid")
        print("  4. The database exists (create it manually if needed)")
        return False


def drop_tables():
    """
    Drop all database tables. USE WITH CAUTION!
    """
    response = input("⚠️  WARNING: This will delete ALL data! Type 'yes' to confirm: ")
    if response.lower() != 'yes':
        print("Operation cancelled.")
        return False
    
    try:
        print("\nDropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped successfully")
        return True
    except Exception as e:
        print(f"\n✗ Error dropping tables: {e}")
        return False


def reset_database():
    """
    Drop and recreate all tables. USE WITH CAUTION!
    """
    print("=" * 60)
    print("Database Reset - This will DELETE ALL DATA")
    print("=" * 60)
    
    if drop_tables():
        return create_tables()
    return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize YesReply database")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop all tables and recreate (WARNING: deletes all data)"
    )
    
    args = parser.parse_args()
    
    if args.reset:
        success = reset_database()
    else:
        success = create_tables()
    
    sys.exit(0 if success else 1)

