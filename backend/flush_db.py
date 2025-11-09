#!/usr/bin/env python3
"""
Script to flush the database by dropping all tables.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
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


def flush_database():
    """
    Drop all database tables. USE WITH CAUTION!
    """
    print("=" * 60)
    print("⚠️  FLUSHING DATABASE - This will DELETE ALL DATA")
    print("=" * 60)
    
    try:
        print("\nDropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped successfully")
        
        print("\nRecreating all tables...")
        Base.metadata.create_all(bind=engine)
        print("✓ All tables recreated successfully")
        
        print("\n" + "=" * 60)
        print("✅ Database flushed and reset successfully!")
        print("=" * 60)
        return True
    except Exception as e:
        print(f"\n✗ Error flushing database: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = flush_database()
    sys.exit(0 if success else 1)

