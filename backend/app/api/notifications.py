from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.session import get_db
from ..db.models import Notification, User
from ..core.security import get_current_user
from .schemas import (
    NotificationResponse,
    NotificationListResponse,
    NotificationMarkRead,
    MessageResponse
)
from ..utils.notification_manager import (
    mark_notifications_as_read,
    get_unread_notification_count
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of notifications for the current user.
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    # Filter by unread if requested
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    # Get total count
    total = query.count()
    
    # Get unread count
    unread_count = get_unread_notification_count(db, current_user.id)
    
    # Apply pagination
    offset = (page - 1) * page_size
    notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(page_size).all()
    
    return NotificationListResponse(
        notifications=notifications,
        total=total,
        unread_count=unread_count,
        page=page,
        page_size=page_size,
        has_more=total > (page * page_size)
    )


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get count of unread notifications.
    """
    unread_count = get_unread_notification_count(db, current_user.id)
    return {"unread_count": unread_count}


@router.post("/mark-read", response_model=MessageResponse)
async def mark_as_read(
    request: NotificationMarkRead,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark notifications as read.
    """
    count = mark_notifications_as_read(db, request.notification_ids, current_user.id)
    
    return MessageResponse(
        message=f"Marked {count} notification(s) as read",
        success=True
    )


@router.post("/mark-all-read", response_model=MessageResponse)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read for the current user.
    """
    # Get all unread notification IDs
    unread_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).all()
    
    notification_ids = [n.id for n in unread_notifications]
    
    if not notification_ids:
        return MessageResponse(
            message="No unread notifications",
            success=True
        )
    
    count = mark_notifications_as_read(db, notification_ids, current_user.id)
    
    return MessageResponse(
        message=f"Marked {count} notification(s) as read",
        success=True
    )


@router.delete("/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a notification.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return MessageResponse(
        message="Notification deleted successfully",
        success=True
    )

