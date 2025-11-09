"""
Notification management utilities.
"""
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional
import uuid
from datetime import datetime

from ..db.models import Notification, NotificationType, Email, User


def create_payment_received_notification(
    db: Session,
    user: User,
    email: Email,
    amount: Decimal,
    potential_amount: Decimal,
    transaction_id: Optional[str] = None
) -> Notification:
    """
    Create a notification when a user receives initial payment for an email.
    
    Args:
        db: Database session
        user: User receiving the payment
        email: Email that generated the payment
        amount: Amount received
        potential_amount: Additional amount that can be earned by responding
        transaction_id: Optional transaction ID
    
    Returns:
        Notification: Created notification
    """
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user.id,
        type=NotificationType.PAYMENT_RECEIVED,
        title=f"You earned ${float(amount):.2f}",
        message=f"You received ${float(amount):.2f} for receiving an email from {email.sender.username if email.sender else 'unknown'}. Reply to earn ${float(potential_amount):.2f} more!",
        amount=amount,
        potential_amount=potential_amount,
        email_id=email.id,
        transaction_id=transaction_id,
        is_read=False
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification


def create_payment_response_notification(
    db: Session,
    user: User,
    email: Email,
    amount: Decimal,
    transaction_id: Optional[str] = None
) -> Notification:
    """
    Create a notification when a user receives full payment for responding to an email.
    
    Args:
        db: Database session
        user: User receiving the payment
        email: Email that generated the payment
        amount: Amount received for responding
        transaction_id: Optional transaction ID
    
    Returns:
        Notification: Created notification
    """
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user.id,
        type=NotificationType.PAYMENT_RESPONSE_AVAILABLE,
        title=f"You earned ${float(amount):.2f} for responding",
        message=f"You received ${float(amount):.2f} for responding to an email from {email.sender.username if email.sender else 'unknown'}. Great job!",
        amount=amount,
        potential_amount=None,
        email_id=email.id,
        transaction_id=transaction_id,
        is_read=False
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification


def create_refund_notification(
    db: Session,
    user: User,
    email: Email,
    refund_amount: Decimal,
    transaction_id: Optional[str] = None
) -> Notification:
    """
    Create a notification when a user receives a refund for an unreplied email.
    
    Args:
        db: Database session
        user: User receiving the refund
        email: Email that was not replied to
        refund_amount: Amount refunded
        transaction_id: Optional transaction ID
    
    Returns:
        Notification: Created notification
    """
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user.id,
        type=NotificationType.REFUND_PROCESSED,
        title=f"Refund of ${float(refund_amount):.2f} processed",
        message=f"Your email to {email.receiver.username if email.receiver else 'unknown'} was not replied to within 48 hours. You received a refund of ${float(refund_amount):.2f}.",
        amount=refund_amount,
        potential_amount=None,
        email_id=email.id,
        transaction_id=transaction_id,
        is_read=False
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification


def mark_notifications_as_read(
    db: Session,
    notification_ids: list[str],
    user_id: str
) -> int:
    """
    Mark notifications as read.
    
    Args:
        db: Database session
        notification_ids: List of notification IDs to mark as read
        user_id: User ID (for security - only mark user's own notifications)
    
    Returns:
        int: Number of notifications marked as read
    """
    notifications = db.query(Notification).filter(
        Notification.id.in_(notification_ids),
        Notification.user_id == user_id,
        Notification.is_read == False
    ).all()
    
    count = 0
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        count += 1
    
    db.commit()
    
    return count


def get_unread_notification_count(db: Session, user_id: str) -> int:
    """
    Get count of unread notifications for a user.
    
    Args:
        db: Database session
        user_id: User ID
    
    Returns:
        int: Number of unread notifications
    """
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

