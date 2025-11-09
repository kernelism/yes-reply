"""
Scheduled job for processing 48-hour refunds.
Run this script periodically (e.g., via cron or systemd timer) to process refunds.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.db.session import SessionLocal
from app.utils.payment_processor import process_all_pending_refunds
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_refund_processor():
    """
    Main function to run the refund processor.
    This should be called periodically (e.g., every hour).
    """
    logger.info("Starting 48-hour refund processor...")
    
    try:
        # Get database session
        db = SessionLocal()
        
        try:
            # Process all pending refunds
            refund_count = process_all_pending_refunds(db)
            
            logger.info(f"✅ Refund processor completed. Processed {refund_count} refund(s).")
            
            return refund_count
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Error running refund processor: {str(e)}")
        raise


if __name__ == "__main__":
    """
    Run the refund processor when script is executed directly.
    
    Usage:
        python -m app.utils.refund_scheduler
        
    Or set up a cron job:
        # Run every hour
        0 * * * * cd /path/to/yesreply/backend && python -m app.utils.refund_scheduler
    """
    try:
        refund_count = run_refund_processor()
        sys.exit(0)
    except Exception as e:
        logger.error(f"Failed to run refund processor: {str(e)}")
        sys.exit(1)

