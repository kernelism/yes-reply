"""
Payment processing utilities for email transactions.
"""
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional
import uuid
from datetime import datetime, timedelta

from ..db.models import (
    User, Email, Transaction,
    TransactionType, TransactionStatus
)
from ..core.config import settings
from .notification_manager import (
    create_payment_received_notification,
    create_payment_response_notification,
    create_refund_notification
)


def process_email_send_payment(
    db: Session,
    email: Email,
    sender: User,
    receiver: User,
    payment_amount: Decimal
) -> bool:
    """
    Process payment when an email is sent.
    Deducts credits from sender's wallet.
    
    Returns:
        bool: True if payment successful, False otherwise
    """
    # Check if sender has sufficient balance
    if sender.wallet_balance < payment_amount:
        return False
    
    # Deduct from sender
    sender.wallet_balance -= payment_amount
    
    # Update email payment tracking (only if not already set)
    # The create_email function sets these correctly for follow-ups
    if not email.payment_amount:
        email.payment_amount = payment_amount
    if not email.initial_payment_amount:
        email.initial_payment_amount = Decimal(str(settings.EMAIL_RECEIVE_PAYMENT))
    if email.remaining_payment_amount is None:
        email.remaining_payment_amount = payment_amount - Decimal(str(settings.EMAIL_RECEIVE_PAYMENT))
    
    # Create transaction for sender (deduction)
    transaction = Transaction(
        id=str(uuid.uuid4()),
        user_id=sender.id,
        type=TransactionType.EMAIL_SENT_DEDUCTION,
        status=TransactionStatus.COMPLETED,
        amount=-payment_amount,  # Negative for deduction
        balance_after=sender.wallet_balance,
        email_id=email.id,
        description=f"Payment for email to {receiver.username}"
    )
    
    db.add(transaction)
    db.commit()
    
    return True


def process_email_receive_payment(
    db: Session,
    email: Email,
    receiver: User
) -> bool:
    """
    Process payment when an email is received (delivered).
    Transfers initial payment ($0.20) to receiver.
    
    Returns:
        bool: True if payment sent, False if already sent
    """
    # Check if already paid
    if email.initial_payment_sent:
        return False
    
    # Check if there's a payment amount set
    if not email.payment_amount or email.payment_amount <= 0:
        return False
    
    # Add initial payment to receiver
    initial_amount = email.initial_payment_amount or Decimal(str(settings.EMAIL_RECEIVE_PAYMENT))
    receiver.wallet_balance = (receiver.wallet_balance or Decimal(0)) + initial_amount
    
    # Mark as paid
    email.initial_payment_sent = True
    
    # Create transaction for receiver
    transaction = Transaction(
        id=str(uuid.uuid4()),
        user_id=receiver.id,
        type=TransactionType.EMAIL_RECEIVED,
        status=TransactionStatus.COMPLETED,
        amount=initial_amount,
        balance_after=receiver.wallet_balance,
        email_id=email.id,
        description=f"Payment for receiving email from {email.sender.username if email.sender else 'unknown'}"
    )
    
    db.add(transaction)
    db.commit()
    
    # Create notification with potential earnings
    potential_amount = email.remaining_payment_amount or Decimal(0)
    create_payment_received_notification(
        db=db,
        user=receiver,
        email=email,
        amount=initial_amount,
        potential_amount=potential_amount,
        transaction_id=transaction.id
    )
    
    return True


def process_email_response_payment(
    db: Session,
    original_email: Email,
    receiver: User
) -> bool:
    """
    Process payment when receiver responds to an email.
    Transfers remaining payment amount to receiver.
    
    Returns:
        bool: True if payment sent, False if already sent or no remaining amount
    """
    # Check if already paid
    if original_email.full_payment_sent:
        return False
    
    # Check if initial payment was sent
    if not original_email.initial_payment_sent:
        return False
    
    # Calculate remaining amount: total payment minus what was already paid initially
    # This ensures we always pay the correct remaining amount even if DB value is incorrect
    initial_paid = original_email.initial_payment_amount or Decimal(str(settings.EMAIL_RECEIVE_PAYMENT))
    total_payment = original_email.payment_amount or Decimal(0)
    remaining_amount = total_payment - initial_paid
    
    # Check if there's remaining payment
    if remaining_amount <= 0:
        return False
    
    # Add remaining payment to receiver
    receiver.wallet_balance = (receiver.wallet_balance or Decimal(0)) + remaining_amount
    
    # Mark as fully paid and update remaining amount in DB to reflect what was actually paid
    original_email.full_payment_sent = True
    original_email.remaining_payment_amount = remaining_amount
    
    # Create transaction for receiver
    transaction = Transaction(
        id=str(uuid.uuid4()),
        user_id=receiver.id,
        type=TransactionType.EMAIL_RESPONDED,
        status=TransactionStatus.COMPLETED,
        amount=remaining_amount,
        balance_after=receiver.wallet_balance,
        email_id=original_email.id,
        description=f"Payment for responding to email from {original_email.sender.username if original_email.sender else 'unknown'}"
    )
    
    db.add(transaction)
    db.commit()
    
    # Create notification for response payment
    create_payment_response_notification(
        db=db,
        user=receiver,
        email=original_email,
        amount=remaining_amount,
        transaction_id=transaction.id
    )
    
    return True


def get_user_available_balance(user: User) -> Decimal:
    """
    Get user's available wallet balance.
    """
    return user.wallet_balance or Decimal(0)


def validate_payment_amount(amount: Decimal) -> bool:
    """
    Validate if payment amount is acceptable.
    Minimum is EMAIL_RECEIVE_PAYMENT ($0.20) to ensure receiver gets something.
    """
    min_amount = Decimal(str(settings.EMAIL_RECEIVE_PAYMENT))
    return amount >= min_amount


def process_48hour_refund(db: Session, email: Email) -> bool:
    """
    Process refund for emails not replied to within 48 hours.
    Sender gets back remaining_payment_amount (total - $0.20).
    Receiver keeps the guaranteed $0.20.
    
    Args:
        db: Database session
        email: Email to process refund for
    
    Returns:
        bool: True if refund processed, False if not eligible
    """
    # Check if refund already processed
    if email.refund_processed:
        return False
    
    # Check if email has payment
    if not email.payment_amount or email.payment_amount <= 0:
        return False
    
    # Check if initial payment was sent
    if not email.initial_payment_sent:
        return False
    
    # Check if full payment already sent (user replied)
    if email.full_payment_sent:
        return False
    
    # Check if it's been 48 hours since email was sent
    if not email.sent_at:
        return False
    
    time_since_sent = datetime.utcnow() - email.sent_at
    if time_since_sent < timedelta(hours=48):
        return False
    
    # Check if there's any remaining amount to refund
    remaining_amount = email.remaining_payment_amount or Decimal(0)
    if remaining_amount <= 0:
        return False
    
    # Get sender
    sender = email.sender
    if not sender:
        return False
    
    # Process refund - return remaining amount to sender
    sender.wallet_balance = (sender.wallet_balance or Decimal(0)) + remaining_amount
    
    # Mark refund as processed
    email.refund_processed = True
    email.refund_amount = remaining_amount
    email.refund_processed_at = datetime.utcnow()
    
    # Create transaction for sender (refund)
    transaction = Transaction(
        id=str(uuid.uuid4()),
        user_id=sender.id,
        type=TransactionType.REFUND,
        status=TransactionStatus.COMPLETED,
        amount=remaining_amount,
        balance_after=sender.wallet_balance,
        email_id=email.id,
        description=f"Refund for unreplied email to {email.receiver.username if email.receiver else 'unknown'} (48-hour timeout)"
    )
    
    db.add(transaction)
    db.commit()
    
    # Create notification for sender
    create_refund_notification(
        db=db,
        user=sender,
        email=email,
        refund_amount=remaining_amount,
        transaction_id=transaction.id
    )
    
    return True


def process_all_pending_refunds(db: Session) -> int:
    """
    Process all emails eligible for 48-hour refund.
    This should be run periodically (e.g., every hour).
    
    Args:
        db: Database session
    
    Returns:
        int: Number of refunds processed
    """
    # Find all emails that:
    # 1. Were sent more than 48 hours ago
    # 2. Have not received full payment (not replied)
    # 3. Have not been refunded yet
    # 4. Have initial payment sent
    
    cutoff_time = datetime.utcnow() - timedelta(hours=48)
    
    eligible_emails = db.query(Email).filter(
        Email.sent_at <= cutoff_time,
        Email.sent_at.isnot(None),
        Email.initial_payment_sent == True,
        Email.full_payment_sent == False,
        Email.refund_processed == False,
        Email.remaining_payment_amount > 0
    ).all()
    
    refund_count = 0
    for email in eligible_emails:
        if process_48hour_refund(db, email):
            refund_count += 1
    
    return refund_count

