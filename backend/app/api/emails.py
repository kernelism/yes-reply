from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import uuid
import logging
import re
import time
import google.generativeai as genai

from ..db.session import get_db
from ..db.models import Email, User, EmailStatus
from ..core.security import get_current_user
from ..core.config import settings
from ..utils.ses import send_raw_email_via_ses, check_ses_sending_enabled
from ..utils.payment_processor import (
    process_email_send_payment,
    process_email_receive_payment,
    process_email_response_payment,
    get_user_available_balance,
    validate_payment_amount
)
from ..utils.prompt_templates import EmailSummaryPromptTemplate
from .schemas import (
    EmailCreate,
    EmailUpdate,
    EmailReply,
    EmailResponse,
    EmailThreadResponse,
    EmailListResponse,
    MessageResponse,
    BulkArchiveRequest,
    BulkDeleteRequest,
    BulkStarRequest,
    ForwardEmailRequest,
    SmartSummaryResponse,
    AIAskRequest
)

router = APIRouter(prefix="/emails", tags=["emails"])


def email_to_response(email: Email) -> dict:
    """Convert Email model to response dict with email addresses and usernames."""
    email_dict = {
        "id": email.id,
        "sent_by": email.sent_by,
        "received_by": email.received_by,
        "sender_email": email.sender.email if email.sender else None,
        "receiver_email": email.receiver.email if email.receiver else None,
        "sender_username": email.sender.username if email.sender else None,
        "receiver_username": email.receiver.username if email.receiver else None,
        "subject": email.subject,
        "body": email.body,
        "html_body": email.html_body,
        "attachments": email.attachments,
        "original_email_id": email.original_email_id,
        "thread_number": email.thread_number,
        "thread_root_id": email.thread_root_id,
        "message_id": email.message_id,
        "in_reply_to": email.in_reply_to,
        "references": email.references,
        "status": email.status,
        "is_read": email.is_read,
        "is_starred": email.is_starred,
        "is_archived": email.is_archived,
        "is_deleted": email.is_deleted,
        "priority": email.priority,
        "external_message_id": email.external_message_id,
        "external_thread_id": email.external_thread_id,
        "created_at": email.created_at,
        "sent_at": email.sent_at,
        "delivered_at": email.delivered_at,
        "read_at": email.read_at
    }
    return email_dict


def calculate_thread_info(db: Session, original_email_id: Optional[str]) -> tuple[Optional[str], int]:
    """Calculate thread_root_id and thread_number for a new email."""
    if not original_email_id:
        return None, 0
    
    # Get the parent email
    parent_email = db.query(Email).filter(Email.id == original_email_id).first()
    if not parent_email:
        return None, 0
    
    # Get the root of the thread
    thread_root_id = parent_email.thread_root_id or parent_email.id
    
    # Calculate the next thread number
    max_thread_num = db.query(Email).filter(
        Email.thread_root_id == thread_root_id
    ).count()
    
    return thread_root_id, max_thread_num


@router.post("/", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
async def create_email(
    email_data: EmailCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new email.
    - If original_email_id is provided, this is a reply
    - Thread relationships are automatically managed
    - received_by can be either a user ID or email address
    """
    # Verify recipient exists - only accept username (for @yesreply.tech emails)
    recipient = None
    
    if email_data.received_by:
        # Remove @yesreply.tech if provided
        username = email_data.received_by.replace('@yesreply.tech', '').strip()
        
        # Try to find by username first (primary method)
        recipient = db.query(User).filter(User.username == username).first()
        
        # If not found by username, try by ID (for backward compatibility)
        if not recipient:
            recipient = db.query(User).filter(User.id == email_data.received_by).first()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipient not found. Please use username (e.g., 'username' or 'username@yesreply.tech')"
        )
    
    # Ensure recipient has a username
    if not recipient.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recipient does not have a valid username. Please contact support."
        )
    
    # Calculate thread information
    thread_root_id, thread_number = calculate_thread_info(db, email_data.original_email_id)
    
    # Validate and set payment amount
    payment_amount = Decimal(0)
    initial_payment_amount = Decimal(0)
    remaining_payment_amount = Decimal(0)
    is_follow_up = False
    
    if not email_data.original_email_id:
        # New thread - use receiver's price_limit as the required payment
        payment_amount = Decimal(str(recipient.price_limit)) if recipient.price_limit else Decimal(str(settings.EMAIL_RECEIVE_PAYMENT))
        
        # Ensure minimum payment is EMAIL_RECEIVE_PAYMENT ($0.20)
        min_payment = Decimal(str(settings.EMAIL_RECEIVE_PAYMENT))
        if payment_amount < min_payment:
            payment_amount = min_payment
        
        # Standard split payment: $0.20 on receive, rest on reply
        initial_payment_amount = Decimal(str(settings.EMAIL_RECEIVE_PAYMENT))
        remaining_payment_amount = payment_amount - initial_payment_amount
    else:
        # This is a reply - check if it's a follow-up from the original thread initiator
        root_email = db.query(Email).filter(Email.id == thread_root_id).first()
        
        if root_email and root_email.sent_by == current_user.id:
            # Follow-up email from original initiator
            # Cost is 10% of original price or $0.20, whichever is higher
            original_price = root_email.payment_amount or Decimal(0)
            followup_price = max(original_price * Decimal("0.10"), Decimal(str(settings.EMAIL_RECEIVE_PAYMENT)))
            
            payment_amount = followup_price
            # Receiver gets full amount immediately (no split)
            initial_payment_amount = followup_price
            remaining_payment_amount = Decimal(0)
            is_follow_up = True
        # else: Regular reply (receiver replying to sender) - no payment required
    
    # Check if sender has sufficient balance
    if payment_amount > 0:
        sender_balance = get_user_available_balance(current_user)
        if sender_balance < payment_amount:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Insufficient wallet balance. This email requires ${float(payment_amount)}. Your balance: ${float(sender_balance)}. Please add funds to your wallet."
            )
    
    # Create email
    email = Email(
        id=str(uuid.uuid4()),
        sent_by=current_user.id,
        received_by=recipient.id,  # Use the actual recipient ID
        subject=email_data.subject,
        body=email_data.body,
        html_body=email_data.html_body,
        attachments=email_data.attachments,
        original_email_id=email_data.original_email_id,
        thread_number=thread_number,
        thread_root_id=thread_root_id if email_data.original_email_id else None,
        priority=email_data.priority.value,
        status=EmailStatus.DRAFT.value,
        is_read=False,
        payment_amount=payment_amount,
        initial_payment_amount=initial_payment_amount,
        remaining_payment_amount=remaining_payment_amount
    )
    
    db.add(email)
    db.commit()
    db.refresh(email)
    
    return email


@router.get("/", response_model=EmailListResponse)
async def get_emails(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sent: bool = Query(None, description="Filter by sent emails (true) or received emails (false)"),
    status_filter: Optional[str] = Query(None, alias="status"),
    starred: Optional[bool] = Query(None, description="Filter by starred emails"),
    archived: Optional[bool] = Query(None, description="Filter by archived emails"),
    include_deleted: bool = Query(False, description="Include deleted emails"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of emails for the current user.
    Can filter by sent/received, status, starred, archived, and deleted.
    """
    query = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    )
    
    # Filter by sent or received
    if sent is True:
        # Only show emails where user initiated the conversation (thread_number = 0)
        query = query.filter(
            Email.sent_by == current_user.id,
            Email.thread_number == 0
        )
    elif sent is False:
        # For inbox, show only root emails (thread_number=0) of threads where user received messages
        # This prevents replies from showing as separate items in the inbox
        
        # Get IDs of threads where user received at least one email
        received_thread_roots = db.query(Email.thread_root_id).filter(
            Email.received_by == current_user.id,
            Email.thread_root_id.isnot(None)
        ).distinct().subquery()
        
        # Show root emails where:
        # 1. User directly received the root email (thread_number=0 AND received_by=user), OR
        # 2. It's a root email (thread_number=0) in a thread where user has received messages
        query = query.filter(
            Email.thread_number == 0
        ).filter(
            # User received this root email
            (Email.received_by == current_user.id) |
            # OR this is a root of a thread where user received replies
            (Email.id.in_(received_thread_roots))
        )
    else:
        # Get all emails (sent or received)
        query = query.filter(
            (Email.sent_by == current_user.id) | (Email.received_by == current_user.id)
        )
    
    # Filter out deleted by default
    if not include_deleted:
        query = query.filter(Email.is_deleted == False)
    
    # Filter by status
    if status_filter:
        query = query.filter(Email.status == status_filter)
    
    # Filter by starred
    if starred is not None:
        query = query.filter(Email.is_starred == starred)
    
    # Filter by archived
    if archived is not None:
        query = query.filter(Email.is_archived == archived)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    emails = query.order_by(Email.created_at.desc()).offset(offset).limit(page_size).all()
    
    return EmailListResponse(
        emails=[email_to_response(email) for email in emails],
        total=total,
        page=page,
        page_size=page_size,
        has_more=total > (page * page_size)
    )


@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific email by ID."""
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Verify user has access to this email
    if email.sent_by != current_user.id and email.received_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Mark as read if user is the recipient and email is not read
    if email.received_by == current_user.id and not email.is_read:
        email.is_read = True
        email.read_at = datetime.utcnow()
        db.commit()
        db.refresh(email)
    
    return email_to_response(email)


@router.get("/{email_id}/thread", response_model=EmailThreadResponse)
async def get_email_thread(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get an email with its entire thread.
    Returns the email and all related emails in the thread.
    """
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Verify user has access
    if email.sent_by != current_user.id and email.received_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Get all emails in the thread
    thread_root = email.thread_root_id or email.id
    thread_emails = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(
        (Email.id == thread_root) | (Email.thread_root_id == thread_root)
    ).order_by(Email.thread_number).all()
    
    # Filter to only show emails user has access to
    accessible_thread_emails = [
        e for e in thread_emails
        if e.sent_by == current_user.id or e.received_by == current_user.id
    ]
    
    return EmailThreadResponse(
        email=email_to_response(email),
        thread_emails=[email_to_response(e) for e in accessible_thread_emails],
        reply_count=len(accessible_thread_emails) - 1
    )


@router.patch("/{email_id}", response_model=EmailResponse)
async def update_email(
    email_id: str,
    email_update: EmailUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an email.
    Only the sender can update the email content.
    Recipients can mark as read.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Check permissions
    is_sender = email.sent_by == current_user.id
    is_recipient = email.received_by == current_user.id
    
    if not (is_sender or is_recipient):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Only sender can update content
    if email_update.subject or email_update.body or email_update.html_body:
        if not is_sender:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the sender can update email content"
            )
        
        if email_update.subject:
            email.subject = email_update.subject
        if email_update.body:
            email.body = email_update.body
        if email_update.html_body is not None:
            email.html_body = email_update.html_body
    
    # Update status
    if email_update.status:
        email.status = email_update.status.value
        
        # Update timestamps based on status
        if email_update.status == "sent" and not email.sent_at:
            email.sent_at = datetime.utcnow()
        elif email_update.status == "delivered" and not email.delivered_at:
            email.delivered_at = datetime.utcnow()
    
    # Update read status (recipient can do this)
    if email_update.is_read is not None:
        if not is_recipient:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the recipient can mark as read"
            )
        email.is_read = email_update.is_read
        if email_update.is_read and not email.read_at:
            email.read_at = datetime.utcnow()
    
    # Update starred (both sender and recipient can do this)
    if email_update.is_starred is not None:
        email.is_starred = email_update.is_starred
    
    # Update archived (both sender and recipient can do this)
    if email_update.is_archived is not None:
        email.is_archived = email_update.is_archived
    
    # Update deleted (both sender and recipient can do this)
    if email_update.is_deleted is not None:
        email.is_deleted = email_update.is_deleted
    
    # Update priority (only sender)
    if email_update.priority:
        if not is_sender:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the sender can update priority"
            )
        email.priority = email_update.priority.value
    
    db.commit()
    db.refresh(email)
    
    return email


@router.post("/{email_id}/send", response_model=EmailResponse)
async def send_email(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a draft email.
    Changes status from DRAFT to SENT and sets sent_at timestamp.
    
    Note: Payment logic will be added separately. Currently assumes payment is handled.
    """
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Verify sender
    if email.sent_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the sender can send this email"
        )
    
    # Check if already sent
    if email.status != EmailStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email has already been sent"
        )
    
    # Check wallet balance before processing payment (for new threads and follow-ups)
    if email.payment_amount and email.payment_amount > 0:
        available_balance = get_user_available_balance(current_user)
        if available_balance < email.payment_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient wallet balance. Required: ${float(email.payment_amount)}, Available: ${float(available_balance)}"
            )
        
        # Process payment (deduct from sender)
        payment_success = process_email_send_payment(
            db=db,
            email=email,
            sender=current_user,
            receiver=email.receiver,
            payment_amount=email.payment_amount
        )
        
        if not payment_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process payment. Insufficient wallet balance."
            )
        
        # Refresh user balance
        db.refresh(current_user)
    
    # Generate Message-ID for threading
    if not email.message_id:
        email.message_id = f"<{email.id}@yesreply.tech>"
    
    # Build References header for threading
    if email.in_reply_to:
        if email.references:
            email.references = f"{email.references} {email.in_reply_to}"
        else:
            email.references = email.in_reply_to
    
    # Send email via AWS SES
    try:
        # Ensure both sender and receiver have usernames
        if not email.sender.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sender does not have a valid username. Please contact support."
            )
        if not email.receiver.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recipient does not have a valid username. Please contact support."
            )
        
        # Determine sender and recipient email addresses (must be @yesreply.tech)
        from_email = f"{email.sender.username}@yesreply.tech"
        to_email = f"{email.receiver.username}@yesreply.tech"
        
        # Send via SES with threading headers and attachments
        ses_response = send_raw_email_via_ses(
            from_email=from_email,
            to_email=to_email,
            subject=email.subject,
            body_text=email.body,
            body_html=email.html_body,
            message_id=email.message_id,
            in_reply_to=email.in_reply_to,
            references=email.references,
            attachments=email.attachments
        )
        
        # Update email with SES MessageId
        if ses_response and 'MessageId' in ses_response:
            email.external_message_id = ses_response['MessageId']
    
        # Update status
        email.status = EmailStatus.SENT.value
        email.sent_at = datetime.utcnow()
        
        # Process initial payment to receiver when email is sent/delivered
        # For new threads: $0.20 on receive, rest on reply
        # For follow-ups: full amount immediately
        if email.payment_amount and email.payment_amount > 0:
            process_email_receive_payment(
                db=db,
                email=email,
                receiver=email.receiver
            )
            db.refresh(email.receiver)
        
        db.commit()
        db.refresh(email)
        
        return email_to_response(email)
        
    except Exception as e:
        # If SES sending fails, rollback and return error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email via SES: {str(e)}"
        )


@router.post("/{email_id}/reply", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
async def reply_to_email(
    email_id: str,
    reply_data: EmailReply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reply to an email.
    Creates a new email linked to the original with proper threading and sends via SES.
    
    Args:
        email_id: ID of the email being replied to
        body: Reply message body (plain text)
        html_body: Optional HTML version of the reply
        
    Returns:
        EmailResponse: The created reply email
    """
    # Get the original email
    original_email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not original_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original email not found"
        )
    
    # Verify user has access to reply (must be sender or recipient of original)
    if original_email.sent_by != current_user.id and original_email.received_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to reply to this email"
        )
    
    # Ensure original email has a message_id for threading
    if not original_email.message_id:
        original_email.message_id = f"<{original_email.id}@yesreply.tech>"
        db.commit()
        db.refresh(original_email)
    
    # Determine recipient of reply (opposite of who current user is)
    if original_email.sent_by == current_user.id:
        # Current user was sender, so reply to receiver
        reply_to_user = original_email.receiver
    else:
        # Current user was receiver, so reply to sender
        reply_to_user = original_email.sender
    
    # Calculate thread information
    thread_root_id = original_email.thread_root_id or original_email.id
    thread_number = db.query(Email).filter(
        Email.thread_root_id == thread_root_id
    ).count()
    
    # Build subject with Re: prefix if not already present
    reply_subject = original_email.subject
    if not reply_subject.lower().startswith('re:'):
        reply_subject = f"Re: {reply_subject}"
    
    # Generate Message-ID for this reply
    reply_id = str(uuid.uuid4())
    reply_message_id = f"<{reply_id}@yesreply.tech>"
    
    # Build References header (includes all previous message IDs in thread)
    reply_references = original_email.message_id
    if original_email.references:
        reply_references = f"{original_email.references} {original_email.message_id}"
    
    # Create reply email record
    reply_email = Email(
        id=reply_id,
        sent_by=current_user.id,
        received_by=reply_to_user.id,
        subject=reply_subject,
        body=reply_data.body,
        html_body=reply_data.html_body,
        attachments=reply_data.attachments,
        original_email_id=original_email.id,
        thread_number=thread_number,
        thread_root_id=thread_root_id,
        message_id=reply_message_id,
        in_reply_to=original_email.message_id,
        references=reply_references,
        status=EmailStatus.DRAFT.value,
        is_read=False,
        created_at=datetime.utcnow()
    )
    
    db.add(reply_email)
    db.commit()
    db.refresh(reply_email)
    
    # Process payment if receiver is replying to original paid email
    # Find the root email of the thread (the one with payment)
    root_email = db.query(Email).filter(Email.id == thread_root_id).first()
    
    # If current user is the original receiver and they're replying
    if root_email and root_email.received_by == current_user.id:
        # Process the response payment
        payment_processed = process_email_response_payment(
            db=db,
            original_email=root_email,
            receiver=current_user
        )
        
        if payment_processed:
            # Refresh user balance after payment
            db.refresh(current_user)
    
    # Send the reply via SES
    try:
        from_email = f"{current_user.username}@yesreply.tech"
        to_email = f"{reply_to_user.username}@yesreply.tech" if reply_to_user.username else reply_to_user.email
        
        ses_response = send_raw_email_via_ses(
            from_email=from_email,
            to_email=to_email,
            subject=reply_subject,
            body_text=reply_data.body,
            body_html=reply_data.html_body,
            message_id=reply_message_id,
            in_reply_to=original_email.message_id,
            references=reply_references,
            attachments=reply_email.attachments
        )
        
        # Update email status after successful send
        if ses_response and 'MessageId' in ses_response:
            reply_email.external_message_id = ses_response['MessageId']
        
        reply_email.status = EmailStatus.SENT.value
        reply_email.sent_at = datetime.utcnow()
        
        db.commit()
        db.refresh(reply_email)
        
        return email_to_response(reply_email)
        
    except Exception as e:
        # If SES sending fails, keep the email as draft but return error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send reply via SES: {str(e)}"
        )


@router.post("/{email_id}/star", response_model=EmailResponse)
async def toggle_star(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle starred status of an email.
    """
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Verify user has access
    if email.sent_by != current_user.id and email.received_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Toggle starred
    email.is_starred = not email.is_starred
    
    db.commit()
    db.refresh(email)
    
    return email_to_response(email)


@router.put("/{email_id}/read", response_model=EmailResponse)
async def mark_as_read(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark an email as read.
    Only the recipient can mark an email as read.
    """
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Verify user is the recipient
    if email.received_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the recipient can mark an email as read"
        )
    
    # Mark as read
    if not email.is_read:
        email.is_read = True
        if not email.read_at:
            email.read_at = datetime.utcnow()
    
    db.commit()
    db.refresh(email)
    
    return email_to_response(email)


@router.post("/{email_id}/archive", response_model=EmailResponse)
async def toggle_archive(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle archived status of an email.
    """
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Verify user has access
    if email.sent_by != current_user.id and email.received_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Toggle archived
    email.is_archived = not email.is_archived
    
    db.commit()
    db.refresh(email)
    
    return email_to_response(email)


@router.post("/bulk/star", response_model=MessageResponse)
async def bulk_star(
    request: BulkStarRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Star or unstar multiple emails at once.
    """
    updated_count = 0
    for email_id in request.email_ids:
        email = db.query(Email).filter(Email.id == email_id).first()
        if email and (email.sent_by == current_user.id or email.received_by == current_user.id):
            email.is_starred = request.starred
            updated_count += 1
    
    db.commit()
    
    return MessageResponse(
        message=f"Updated {updated_count} emails",
        success=True
    )


@router.post("/bulk/archive", response_model=MessageResponse)
async def bulk_archive(
    request: BulkArchiveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Archive or unarchive multiple emails at once.
    """
    updated_count = 0
    for email_id in request.email_ids:
        email = db.query(Email).filter(Email.id == email_id).first()
        if email and (email.sent_by == current_user.id or email.received_by == current_user.id):
            email.is_archived = request.archived
            updated_count += 1
    
    db.commit()
    
    return MessageResponse(
        message=f"Updated {updated_count} emails",
        success=True
    )


@router.post("/bulk/delete", response_model=MessageResponse)
async def bulk_delete(
    request: BulkDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete multiple emails at once (soft delete by default).
    """
    deleted_count = 0
    for email_id in request.email_ids:
        email = db.query(Email).filter(Email.id == email_id).first()
        if email and (email.sent_by == current_user.id or email.received_by == current_user.id):
            if request.permanent and email.status == EmailStatus.DRAFT.value and email.sent_by == current_user.id:
                db.delete(email)
            else:
                email.is_deleted = True
            deleted_count += 1
    
    db.commit()
    
    return MessageResponse(
        message=f"Deleted {deleted_count} emails",
        success=True
    )


@router.delete("/{email_id}", response_model=MessageResponse)
async def delete_email(
    email_id: str,
    permanent: bool = Query(False, description="Permanently delete (only for drafts)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an email (soft delete by default, moves to deleted folder).
    Only draft emails can be permanently deleted.
    """
    email = db.query(Email).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Verify user has access
    if email.sent_by != current_user.id and email.received_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    if permanent:
        # Only allow permanent deletion of drafts
        if email.status != EmailStatus.DRAFT.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft emails can be permanently deleted"
            )
        # Only sender can permanently delete
        if email.sent_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the sender can permanently delete this email"
            )
        db.delete(email)
        db.commit()
        return MessageResponse(
            message="Email permanently deleted",
            success=True
        )
    else:
        # Soft delete
        email.is_deleted = True
        db.commit()
        return MessageResponse(
            message="Email moved to deleted",
            success=True
        )


@router.post("/{email_id}/forward", response_model=MessageResponse)
async def forward_email_thread(
    email_id: str,
    forward_request: ForwardEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Forward an entire email thread to an external email address.
    The recipient CANNOT reply to the forwarded email (no-reply headers).
    """
    # Get the email
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Verify user has access
    if email.sent_by != current_user.id and email.received_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Get the entire thread
    thread_root = email.thread_root_id or email.id
    thread_emails = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(
        (Email.id == thread_root) | (Email.thread_root_id == thread_root)
    ).order_by(Email.thread_number).all()
    
    # Filter to only show emails user has access to
    accessible_thread_emails = [
        e for e in thread_emails
        if e.sent_by == current_user.id or e.received_by == current_user.id
    ]
    
    if not accessible_thread_emails:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No accessible emails found in thread"
        )
    
    # Build the forward message
    forward_subject = f"Fwd: {accessible_thread_emails[0].subject}"
    
    # Build thread content in plain text
    thread_content = []
    if forward_request.message:
        thread_content.append(f"---------- Forwarded message ----------\n")
        thread_content.append(f"{forward_request.message}\n\n")
    else:
        thread_content.append(f"---------- Forwarded message ----------\n\n")
    
    for thread_email in accessible_thread_emails:
        sender_name = thread_email.sender.username if thread_email.sender else "Unknown"
        receiver_name = thread_email.receiver.username if thread_email.receiver else "Unknown"
        
        thread_content.append(f"From: {sender_name}@yesreply.tech")
        thread_content.append(f"To: {receiver_name}@yesreply.tech")
        thread_content.append(f"Date: {thread_email.created_at.strftime('%a, %d %b %Y %H:%M:%S')}")
        thread_content.append(f"Subject: {thread_email.subject}\n")
        thread_content.append(thread_email.body)
        thread_content.append("\n" + "="*50 + "\n\n")
    
    forward_body = "\n".join(thread_content)
    
    # Build HTML version
    html_content = []
    html_content.append("<html><body>")
    if forward_request.message:
        html_content.append("<div style='background-color: #f0f0f0; padding: 10px; margin-bottom: 20px; border-left: 4px solid #0066cc;'>")
        html_content.append(f"<p><strong>Forwarded message:</strong></p>")
        html_content.append(f"<p>{forward_request.message.replace(chr(10), '<br>')}</p>")
        html_content.append("</div>")
    
    html_content.append("<hr>")
    
    for thread_email in accessible_thread_emails:
        sender_name = thread_email.sender.username if thread_email.sender else "Unknown"
        receiver_name = thread_email.receiver.username if thread_email.receiver else "Unknown"
        
        html_content.append("<div style='margin-bottom: 30px; border-left: 3px solid #ccc; padding-left: 15px;'>")
        html_content.append(f"<p><strong>From:</strong> {sender_name}@yesreply.tech</p>")
        html_content.append(f"<p><strong>To:</strong> {receiver_name}@yesreply.tech</p>")
        html_content.append(f"<p><strong>Date:</strong> {thread_email.created_at.strftime('%a, %d %b %Y %H:%M:%S')}</p>")
        html_content.append(f"<p><strong>Subject:</strong> {thread_email.subject}</p>")
        html_content.append(f"<div style='margin-top: 10px;'>{thread_email.html_body or thread_email.body.replace(chr(10), '<br>')}</div>")
        html_content.append("</div>")
    
    html_content.append("</body></html>")
    forward_html = "\n".join(html_content)
    
    # Check if recipient is a yesreply.tech user
    recipient_username = None
    if "@yesreply.tech" in forward_request.forward_to.lower():
        recipient_username = forward_request.forward_to.split("@")[0]
    
    recipient_user = None
    if recipient_username:
        recipient_user = db.query(User).filter(User.username == recipient_username).first()
    
    try:
        # For internal yesreply.tech users, ONLY create database record (no SES sending)
        if recipient_user:
            forward_message_id = f"<fwd-{uuid.uuid4()}@yesreply.tech>"
            
            forward_email = Email(
                id=str(uuid.uuid4()),
                sent_by=current_user.id,
                received_by=recipient_user.id,
                subject=forward_subject,
                body=forward_body,
                html_body=forward_html,
                attachments=None,
                original_email_id=None,
                thread_number=0,
                thread_root_id=None,
                message_id=forward_message_id,
                in_reply_to=None,
                references=None,
                status=EmailStatus.DELIVERED.value,  # Delivered directly
                is_read=False,
                sent_at=datetime.utcnow(),
                delivered_at=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            
            db.add(forward_email)
            db.commit()
            db.refresh(forward_email)
            
            return MessageResponse(
                message=f"Email thread forwarded successfully to {forward_request.forward_to}",
                success=True
            )
        
        # For external emails, send via SES
        else:
            from_email = f"{current_user.username}@yesreply.tech"
            to_email = forward_request.forward_to
            
            # Generate unique message ID for this forward
            forward_message_id = f"<fwd-{uuid.uuid4()}@yesreply.tech>"
            
            ses_response = send_raw_email_via_ses(
                from_email=from_email,
                to_email=to_email,
                subject=forward_subject,
                body_text=forward_body,
                body_html=forward_html,
                message_id=forward_message_id,
                in_reply_to=None,  # No reply-to - this is a forward
                references=None,   # No references - break the thread
                attachments=None
            )
            
            if ses_response and 'MessageId' in ses_response:
                return MessageResponse(
                    message=f"Email thread forwarded successfully to {forward_request.forward_to}",
                    success=True
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to forward email"
                )
            
    except Exception as e:
        print(f"Error forwarding email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to forward email: {str(e)}"
        )


@router.get("/{email_id}/smart-summary", response_model=SmartSummaryResponse)
async def get_smart_summary(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an AI-powered summary of an email thread using Gemini AI.
    Returns a crisp, concise summary of the entire conversation.
    """
    # Get the email
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Check if user has access to this email
    if email.received_by != current_user.id and email.sent_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Get thread root ID
    thread_root_id = email.thread_root_id or email.id
    
    # Get all emails in the thread
    thread_emails = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(
        (Email.thread_root_id == thread_root_id) | (Email.id == thread_root_id)
    ).order_by(Email.created_at.asc()).all()
    
    if not thread_emails:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    # Check Gemini API key
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API key not configured"
        )
    
    try:
        # Log thread information
        logger = logging.getLogger(__name__)
        logger.info(f"Generating smart summary for thread root: {thread_root_id}, found {len(thread_emails)} emails in thread")
        
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # First, try to list available models to see what's actually available
        model = None
        try:
            logger.info("Listing available Gemini models...")
            available_models = genai.list_models()
            # Filter models that support generateContent
            supported_models = [
                m for m in available_models 
                if 'generateContent' in m.supported_generation_methods
            ]
            
            if supported_models:
                # Extract model names (remove 'models/' prefix if present)
                model_names = []
                for m in supported_models:
                    model_name = m.name
                    # Remove 'models/' prefix if present
                    if model_name.startswith('models/'):
                        model_name = model_name.replace('models/', '')
                    model_names.append(model_name)
                
                logger.info(f"Found {len(model_names)} available models: {model_names}")
                
                # Try models in order of preference
                preferred_order = [
                    'gemini-2.5-flash',  # Preferred model
                    'gemini-1.0-pro',
                    'gemini-pro',
                    'gemini-1.5-flash',
                    'gemini-1.5-pro'
                ]
                
                # Try preferred models first
                for preferred in preferred_order:
                    if preferred in model_names:
                        try:
                            logger.info(f"Trying preferred model: {preferred}")
                            model = genai.GenerativeModel(preferred)
                            logger.info(f"Successfully initialized model: {preferred}")
                            break
                        except Exception as e:
                            logger.warning(f"Failed to use {preferred}: {str(e)}")
                            continue
                
                # If no preferred model worked, use the first available
                if model is None and model_names:
                    first_model = model_names[0]
                    logger.info(f"Using first available model: {first_model}")
                    model = genai.GenerativeModel(first_model)
            else:
                logger.warning("No models with generateContent support found")
        except Exception as e:
            logger.warning(f"Failed to list models, trying fallback models: {str(e)}")
            # Fallback: try common model names
            fallback_models = ['gemini-2.5-flash', 'gemini-1.0-pro', 'gemini-pro']
            for model_name in fallback_models:
                try:
                    logger.info(f"Trying fallback model: {model_name}")
                    model = genai.GenerativeModel(model_name)
                    logger.info(f"Successfully initialized fallback model: {model_name}")
                    break
                except Exception as e2:
                    logger.warning(f"Fallback model {model_name} failed: {str(e2)}")
                    continue
        
        if model is None:
            error_msg = "Failed to initialize any Gemini model. Please check your API key and model availability."
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
        
        # Build email thread data for prompt template
        thread_email_data = []
        for thread_email in thread_emails:
            sender_name = thread_email.sender.first_name + " " + thread_email.sender.last_name if thread_email.sender else "Unknown"
            receiver_name = thread_email.receiver.first_name + " " + thread_email.receiver.last_name if thread_email.receiver else "Unknown"
            
            # Clean up body text (remove HTML tags if present, limit length)
            body_text = thread_email.body or '(No content)'
            if thread_email.html_body:
                # If HTML body exists, prefer it but we'll use plain text body for now
                pass
            
            thread_email_data.append({
                'sender_name': sender_name,
                'sender_email': thread_email.sender.email if thread_email.sender else 'Unknown',
                'receiver_name': receiver_name,
                'receiver_email': thread_email.receiver.email if thread_email.receiver else 'Unknown',
                'date': thread_email.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'subject': thread_email.subject or '(No subject)',
                'body': body_text
            })
        
        # Use prompt template to build the prompt
        prompt = EmailSummaryPromptTemplate.build_thread_summary_prompt(thread_email_data)
        
        # Generate summary with retry logic for rate limits
        logger.info(f"Sending request to Gemini AI for thread summary...")
        
        max_retries = 3
        retry_delay = 2  # Start with 2 seconds
        
        for attempt in range(max_retries):
            try:
                response = model.generate_content(prompt)
                summary = response.text.strip()
                
                logger.info(f"Successfully generated summary (length: {len(summary)} characters)")
                
                return SmartSummaryResponse(
                    summary=summary,
                    thread_id=thread_root_id
                )
            except Exception as e:
                error_str = str(e)
                
                # Check if it's a quota/rate limit error (429)
                if '429' in error_str or 'quota' in error_str.lower() or 'rate limit' in error_str.lower():
                    if attempt < max_retries - 1:
                        # Extract retry delay from error if available
                        retry_match = re.search(r'retry.*?(\d+)\s*seconds?', error_str, re.IGNORECASE)
                        if retry_match:
                            retry_delay = int(retry_match.group(1)) + 1
                        else:
                            retry_delay = retry_delay * 2  # Exponential backoff
                        
                        logger.warning(f"Rate limit/quota exceeded (attempt {attempt + 1}/{max_retries}). Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
                        continue
                    else:
                        # Last attempt failed
                        logger.error(f"Rate limit/quota exceeded after {max_retries} attempts")
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail="API quota exceeded. Please try again later or check your billing plan. For more information, visit: https://ai.google.dev/gemini-api/docs/rate-limits"
                        )
                else:
                    # Not a rate limit error, re-raise
                    raise
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 429)
        raise
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating smart summary: {str(e)}", exc_info=True)
        
        # Check if it's a quota error
        error_str = str(e)
        if '429' in error_str or 'quota' in error_str.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="API quota exceeded. Please try again later or check your billing plan. For more information, visit: https://ai.google.dev/gemini-api/docs/rate-limits"
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )


def get_gemini_model(logger):
    """Helper function to initialize and return a Gemini model."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    model = None
    try:
        logger.info("Listing available Gemini models...")
        available_models = genai.list_models()
        supported_models = [
            m for m in available_models 
            if 'generateContent' in m.supported_generation_methods
        ]
        
        if supported_models:
            model_names = []
            for m in supported_models:
                model_name = m.name
                if model_name.startswith('models/'):
                    model_name = model_name.replace('models/', '')
                model_names.append(model_name)
            
            logger.info(f"Found {len(model_names)} available models: {model_names}")
            
            preferred_order = [
                'gemini-2.5-flash',
                'gemini-1.0-pro',
                'gemini-pro',
                'gemini-1.5-flash',
                'gemini-1.5-pro'
            ]
            
            for preferred in preferred_order:
                if preferred in model_names:
                    try:
                        logger.info(f"Trying preferred model: {preferred}")
                        model = genai.GenerativeModel(preferred)
                        logger.info(f"Successfully initialized model: {preferred}")
                        return model
                    except Exception as e:
                        logger.warning(f"Failed to use {preferred}: {str(e)}")
                        continue
            
            if model is None and model_names:
                first_model = model_names[0]
                logger.info(f"Using first available model: {first_model}")
                model = genai.GenerativeModel(first_model)
                return model
    except Exception as e:
        logger.warning(f"Failed to list models, trying fallback models: {str(e)}")
        fallback_models = ['gemini-2.5-flash', 'gemini-1.0-pro', 'gemini-pro']
        for model_name in fallback_models:
            try:
                logger.info(f"Trying fallback model: {model_name}")
                model = genai.GenerativeModel(model_name)
                logger.info(f"Successfully initialized fallback model: {model_name}")
                return model
            except Exception as e2:
                logger.warning(f"Fallback model {model_name} failed: {str(e2)}")
                continue
    
    return None


def generate_ai_content(model, prompt, logger, max_retries=3):
    """Helper function to generate content with retry logic."""
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            error_str = str(e)
            
            if '429' in error_str or 'quota' in error_str.lower() or 'rate limit' in error_str.lower():
                if attempt < max_retries - 1:
                    retry_match = re.search(r'retry.*?(\d+)\s*seconds?', error_str, re.IGNORECASE)
                    if retry_match:
                        retry_delay = int(retry_match.group(1)) + 1
                    else:
                        retry_delay = retry_delay * 2
                    
                    logger.warning(f"Rate limit/quota exceeded (attempt {attempt + 1}/{max_retries}). Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    continue
                else:
                    logger.error(f"Rate limit/quota exceeded after {max_retries} attempts")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="API quota exceeded. Please try again later."
                    )
            else:
                raise
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to generate AI response"
    )


def create_ai_email_in_thread(db: Session, thread_root_id: str, current_user: User, subject: str, body: str, attachments: Optional[str] = None):
    """Helper function to create an AI-generated email in a thread."""
    # Generate unique IDs
    new_email_id = str(uuid.uuid4())
    new_message_id = f"<{new_email_id}@yesreply.tech>"
    
    # Get thread info
    thread_root = db.query(Email).filter(Email.id == thread_root_id).first()
    if not thread_root:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread root not found"
        )
    
    # Count existing emails in thread
    thread_count = db.query(Email).filter(
        (Email.thread_root_id == thread_root_id) | (Email.id == thread_root_id)
    ).count()
    
    # Determine sender and receiver (AI responds as the current user to themselves)
    sent_by = current_user.id
    received_by = current_user.id
    
    # Get the last email's message_id for threading
    last_email = db.query(Email).filter(
        (Email.thread_root_id == thread_root_id) | (Email.id == thread_root_id)
    ).order_by(Email.created_at.desc()).first()
    
    in_reply_to = last_email.message_id if last_email else None
    references = last_email.references if last_email else ""
    if in_reply_to:
        references = f"{references} {in_reply_to}".strip()
    
    # Create new email
    ai_email = Email(
        id=new_email_id,
        sent_by=sent_by,
        received_by=received_by,
        subject=subject,
        body=body,
        attachments=attachments,
        original_email_id=thread_root_id,
        thread_number=thread_count,
        thread_root_id=thread_root_id,
        message_id=new_message_id,
        in_reply_to=in_reply_to,
        references=references,
        status=EmailStatus.SENT,
        is_read=False,
        sent_at=datetime.utcnow(),
        delivered_at=datetime.utcnow()
    )
    
    db.add(ai_email)
    db.commit()
    db.refresh(ai_email)
    
    return ai_email


@router.post("/{email_id}/ai-summary", response_model=EmailResponse)
async def create_ai_summary(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an AI-powered summary of an email thread and add it as an email in the thread.
    """
    logger = logging.getLogger(__name__)
    
    # Get the email
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Check if user has access
    if email.received_by != current_user.id and email.sent_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Check Gemini API key
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API key not configured"
        )
    
    # Get thread root ID
    thread_root_id = email.thread_root_id or email.id
    
    # Get all emails in the thread
    thread_emails = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(
        (Email.thread_root_id == thread_root_id) | (Email.id == thread_root_id)
    ).order_by(Email.created_at.asc()).all()
    
    try:
        # Get Gemini model
        model = get_gemini_model(logger)
        if model is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize Gemini model"
            )
        
        # Build email thread data
        thread_email_data = []
        for thread_email in thread_emails:
            sender_name = f"{thread_email.sender.first_name} {thread_email.sender.last_name}" if thread_email.sender else "Unknown"
            receiver_name = f"{thread_email.receiver.first_name} {thread_email.receiver.last_name}" if thread_email.receiver else "Unknown"
            
            thread_email_data.append({
                'sender_name': sender_name,
                'sender_email': thread_email.sender.email if thread_email.sender else 'Unknown',
                'receiver_name': receiver_name,
                'receiver_email': thread_email.receiver.email if thread_email.receiver else 'Unknown',
                'date': thread_email.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'subject': thread_email.subject or '(No subject)',
                'body': thread_email.body or '(No content)'
            })
        
        # Use prompt template
        prompt = EmailSummaryPromptTemplate.build_thread_summary_prompt(thread_email_data)
        
        # Generate summary
        logger.info(f"Generating AI summary for thread: {thread_root_id}")
        summary = generate_ai_content(model, prompt, logger)
        
        # Create email with summary
        subject = f"🤖 AI Summary: {email.subject or 'Thread Summary'}"
        body = f"AI-Generated Summary\n\n{summary}\n\n---\nThis summary was automatically generated by AI based on the email thread."
        
        ai_email = create_ai_email_in_thread(db, thread_root_id, current_user, subject, body)
        
        logger.info(f"Successfully created AI summary email: {ai_email.id}")
        return email_to_response(ai_email)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating AI summary: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI summary: {str(e)}"
        )


@router.post("/{email_id}/ai-ask", response_model=EmailResponse)
async def create_ai_ask(
    email_id: str,
    request: AIAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask AI a question about an email thread and add the answer as an email in the thread.
    """
    logger = logging.getLogger(__name__)
    
    # Get the email
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Check if user has access
    if email.received_by != current_user.id and email.sent_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Check Gemini API key
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API key not configured"
        )
    
    # Get thread root ID
    thread_root_id = email.thread_root_id or email.id
    
    # Get all emails in the thread
    thread_emails = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(
        (Email.thread_root_id == thread_root_id) | (Email.id == thread_root_id)
    ).order_by(Email.created_at.asc()).all()
    
    try:
        # Get Gemini model
        model = get_gemini_model(logger)
        if model is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize Gemini model"
            )
        
        # Build context from thread
        thread_context = ""
        for i, thread_email in enumerate(thread_emails, 1):
            sender_name = f"{thread_email.sender.first_name} {thread_email.sender.last_name}" if thread_email.sender else "Unknown"
            thread_context += f"\n\nEmail {i}:\n"
            thread_context += f"From: {sender_name}\n"
            thread_context += f"Subject: {thread_email.subject or '(No subject)'}\n"
            thread_context += f"Date: {thread_email.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
            thread_context += f"Content:\n{thread_email.body or '(No content)'}\n"
        
        # Build prompt
        prompt = f"""You are an AI assistant analyzing an email thread. Based on the context provided, answer the user's question accurately and provide your response in MARKDOWN format for better readability.

Email Thread Context:
{thread_context}

User's Question: {request.question}

Provide a clear, helpful answer based solely on the information in the email thread. Use markdown formatting:
- Use **bold** for important points
- Use bullet points (-) for lists
- Use headers (##) to organize your response if needed
- Include relevant quotes from the thread if helpful

If the answer isn't available in the thread, clearly state that."""
        
        # Generate answer
        logger.info(f"Generating AI answer for thread: {thread_root_id}, question: {request.question}")
        answer = generate_ai_content(model, prompt, logger)
        
        # Create email with answer
        subject = f"🤖 AI Answer: {request.question[:50]}..."
        body = f"Question: {request.question}\n\nAI Answer:\n{answer}\n\n---\nThis answer was automatically generated by AI based on the email thread context."
        
        ai_email = create_ai_email_in_thread(db, thread_root_id, current_user, subject, body)
        
        logger.info(f"Successfully created AI answer email: {ai_email.id}")
        return email_to_response(ai_email)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating AI answer: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI answer: {str(e)}"
        )


@router.post("/{email_id}/ai-schedule", response_model=EmailResponse)
async def create_ai_schedule(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze conversation and create a meeting schedule with .ics file attachment.
    """
    logger = logging.getLogger(__name__)
    
    # Get the email
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Check if user has access
    if email.received_by != current_user.id and email.sent_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Check Gemini API key
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API key not configured"
        )
    
    # Get thread root ID
    thread_root_id = email.thread_root_id or email.id
    
    # Get all emails in the thread
    thread_emails = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(
        (Email.thread_root_id == thread_root_id) | (Email.id == thread_root_id)
    ).order_by(Email.created_at.asc()).all()
    
    try:
        # Get Gemini model
        model = get_gemini_model(logger)
        if model is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize Gemini model"
            )
        
        # Build context from thread
        thread_context = ""
        for i, thread_email in enumerate(thread_emails, 1):
            sender_name = f"{thread_email.sender.first_name} {thread_email.sender.last_name}" if thread_email.sender else "Unknown"
            thread_context += f"\n\nEmail {i}:\n"
            thread_context += f"From: {sender_name}\n"
            thread_context += f"Subject: {thread_email.subject or '(No subject)'}\n"
            thread_context += f"Date: {thread_email.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
            thread_context += f"Content:\n{thread_email.body or '(No content)'}\n"
        
        # Build prompt for scheduling
        prompt = f"""You are a scheduling assistant. Analyze this email thread and determine if there is ANY indication of wanting to schedule a meeting or conversation.

Look for:
- Direct meeting requests or proposals
- Expressions of interest in connecting, talking, or meeting
- Questions like "interested in learning more?", "want to schedule a call?", "let's connect"
- Invitations to discuss something further

If you find ANY scheduling intent (even vague), create a proposed meeting and set "has_scheduling" to true.
If the thread shows interest but lacks specific details, generate reasonable defaults:
- Use a date 3-5 business days from now
- Default to 10:00 AM time
- Duration: 30 minutes for initial calls, 60 for detailed discussions
- Location: "Virtual Meeting" if not specified
- Create a relevant meeting title and description based on the thread content

Provide your response in this exact JSON format:

{{
  "has_scheduling": true/false,
  "meeting_title": "Title of the meeting",
  "date": "YYYY-MM-DD",
  "time": "HH:MM" (24-hour format),
  "duration_minutes": 30,
  "location": "Location or virtual meeting link",
  "description": "Meeting description/agenda"
}}

Email Thread Context:
{thread_context}

IMPORTANT: Be proactive - if people are expressing interest in connecting or discussing something, help them schedule it even if specific times aren't mentioned yet."""
        
        # Generate scheduling info
        logger.info(f"Generating AI schedule for thread: {thread_root_id}")
        schedule_response = generate_ai_content(model, prompt, logger)
        
        # Try to parse JSON response
        import json
        import base64
        from datetime import datetime as dt, timedelta
        
        try:
            # Extract JSON from response (might have markdown formatting)
            json_match = re.search(r'\{[^}]*"has_scheduling"[^}]*\}', schedule_response, re.DOTALL)
            if json_match:
                schedule_data = json.loads(json_match.group(0))
            else:
                schedule_data = json.loads(schedule_response)
            
            if schedule_data.get('has_scheduling'):
                # Generate .ics file
                meeting_title = schedule_data.get('meeting_title', 'Meeting')
                date_str = schedule_data.get('date', '')
                time_str = schedule_data.get('time', '10:00')
                duration = schedule_data.get('duration_minutes', 30)
                location = schedule_data.get('location', '')
                description = schedule_data.get('description', '')
                
                # Parse date and time
                try:
                    meeting_dt = dt.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
                except:
                    # Default to tomorrow at 10 AM
                    meeting_dt = dt.now() + timedelta(days=1)
                    meeting_dt = meeting_dt.replace(hour=10, minute=0, second=0, microsecond=0)
                
                end_dt = meeting_dt + timedelta(minutes=duration)
                
                # Format for ICS
                def format_ics_date(dt_obj):
                    return dt_obj.strftime("%Y%m%dT%H%M%S")
                
                # Generate ICS content
                ics_content = [
                    'BEGIN:VCALENDAR',
                    'VERSION:2.0',
                    'PRODID:-//YesReply//AI Scheduler//EN',
                    'CALSCALE:GREGORIAN',
                    'METHOD:REQUEST',
                    'BEGIN:VEVENT',
                    f'UID:{str(uuid.uuid4())}@yesreply.tech',
                    f'DTSTAMP:{format_ics_date(dt.now())}',
                    f'DTSTART:{format_ics_date(meeting_dt)}',
                    f'DTEND:{format_ics_date(end_dt)}',
                    f'SUMMARY:{meeting_title}',
                    f'ORGANIZER;CN={current_user.first_name} {current_user.last_name}:MAILTO:{current_user.email}',
                    'STATUS:CONFIRMED',
                    'SEQUENCE:0',
                ]
                
                if description:
                    # Escape newlines for ICS format
                    escaped_description = description.replace('\n', '\\n')
                    ics_content.append(f'DESCRIPTION:{escaped_description}')
                
                if location:
                    ics_content.append(f'LOCATION:{location}')
                
                ics_content.extend([
                    'BEGIN:VALARM',
                    'TRIGGER:-PT15M',
                    'ACTION:DISPLAY',
                    f'DESCRIPTION:Reminder: {meeting_title}',
                    'END:VALARM',
                    'END:VEVENT',
                    'END:VCALENDAR'
                ])
                
                ics_text = '\r\n'.join(ics_content)
                ics_base64 = base64.b64encode(ics_text.encode()).decode()
                
                # Create attachment JSON
                attachment_data = json.dumps([{
                    'filename': f'meeting_{meeting_dt.strftime("%Y%m%d_%H%M")}.ics',
                    'content_type': 'text/calendar; charset=utf-8; method=REQUEST',
                    'data': ics_base64,
                    'size': len(ics_text)
                }])
                
                # Create body
                body = f"""🗓️ Meeting Scheduled

{meeting_title}

📅 Date: {meeting_dt.strftime('%A, %B %d, %Y')}
🕐 Time: {meeting_dt.strftime('%I:%M %p')} - {end_dt.strftime('%I:%M %p')}
⏱️ Duration: {duration} minutes
"""
                if location:
                    body += f"📍 Location: {location}\n"
                if description:
                    body += f"\n📝 Details:\n{description}\n"
                
                body += "\n\n📎 Calendar Invite: Please see attached .ics file to add this meeting to your calendar.\n\n---\nThis meeting was automatically scheduled by AI based on the email thread."
                
                subject = f"🗓️ AI Scheduled: {meeting_title}"
                
                ai_email = create_ai_email_in_thread(db, thread_root_id, current_user, subject, body, attachment_data)
                
                logger.info(f"Successfully created AI schedule email with .ics attachment: {ai_email.id}")
                return email_to_response(ai_email)
            else:
                # No scheduling info found
                body = f"🤖 AI Scheduling Analysis\n\nNo clear scheduling information was found in this email thread.\n\n{schedule_response}\n\n---\nThis analysis was automatically generated by AI."
                subject = "🤖 AI Scheduling: No scheduling info found"
                
                ai_email = create_ai_email_in_thread(db, thread_root_id, current_user, subject, body)
                
                logger.info(f"Created AI schedule email (no scheduling found): {ai_email.id}")
                return email_to_response(ai_email)
                
        except (json.JSONDecodeError, KeyError) as e:
            # Failed to parse, return as text
            logger.warning(f"Failed to parse schedule JSON: {str(e)}")
            body = f"🤖 AI Scheduling Analysis\n\n{schedule_response}\n\n---\nThis analysis was automatically generated by AI."
            subject = "🤖 AI Scheduling Analysis"
            
            ai_email = create_ai_email_in_thread(db, thread_root_id, current_user, subject, body)
            return email_to_response(ai_email)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating AI schedule: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI schedule: {str(e)}"
        )


@router.post("/{email_id}/ai-research", response_model=EmailResponse)
async def create_ai_research(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fact-check content using AI with web search capabilities.
    """
    logger = logging.getLogger(__name__)
    
    # Get the email
    email = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(Email.id == email_id).first()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Check if user has access
    if email.received_by != current_user.id and email.sent_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this email"
        )
    
    # Check Gemini API key
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API key not configured"
        )
    
    # Get thread root ID
    thread_root_id = email.thread_root_id or email.id
    
    # Get all emails in the thread
    thread_emails = db.query(Email).options(
        joinedload(Email.sender),
        joinedload(Email.receiver)
    ).filter(
        (Email.thread_root_id == thread_root_id) | (Email.id == thread_root_id)
    ).order_by(Email.created_at.asc()).all()
    
    try:
        # Get Gemini model with grounding (search)
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Try to use a model with Google Search grounding
        try:
            logger.info("Initializing Gemini model with Google Search grounding...")
            # Use google_search tool (not google_search_retrieval)
            from google.generativeai import protos
            google_search_tool = protos.Tool(
                google_search=protos.GoogleSearch()
            )
            model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                tools=[google_search_tool]
            )
        except Exception as e:
            # Fallback to regular model without search
            logger.warning(f"Failed to use model with grounding: {str(e)}, using regular model")
            model = get_gemini_model(logger)
            if model is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to initialize Gemini model"
                )
        
        # Build context from thread
        thread_context = ""
        for i, thread_email in enumerate(thread_emails, 1):
            sender_name = f"{thread_email.sender.first_name} {thread_email.sender.last_name}" if thread_email.sender else "Unknown"
            thread_context += f"\n\nEmail {i}:\n"
            thread_context += f"From: {sender_name}\n"
            thread_context += f"Subject: {thread_email.subject or '(No subject)'}\n"
            thread_context += f"Content:\n{thread_email.body or '(No content)'}\n"
        
        # Build research prompt
        prompt = f"""You are a fact-checking AI assistant with access to web search. Analyze the following email thread and provide a comprehensive research report in MARKDOWN format.

Your report should include:

## Key Claims Analysis
- List each significant claim or fact mentioned in the thread
- For each claim, provide:
  - **Claim**: The statement being checked
  - **Status**: ✅ Verified | ❌ False | ⚠️ Unclear
  - **Evidence**: Brief explanation with sources
  - **Source**: Link to reference (if available)

## Detailed Findings
Provide detailed analysis of important claims with supporting evidence.

## Recommendations
Any corrections, clarifications, or additional context needed.

Email Thread Context:
{thread_context}

Format your response using markdown with headers (##), bold (**text**), bullet points (-), and links ([text](url)) where appropriate."""
        
        # Generate research
        logger.info(f"Generating AI research for thread: {thread_root_id}")
        research_result = generate_ai_content(model, prompt, logger)
        
        # Create email with research
        subject = f"🔍 AI Research: Fact-Check Results"
        body = f"🔍 AI-Powered Fact-Check & Research\n\n{research_result}\n\n---\nThis research was automatically generated by AI with web search capabilities."
        
        ai_email = create_ai_email_in_thread(db, thread_root_id, current_user, subject, body)
        
        logger.info(f"Successfully created AI research email: {ai_email.id}")
        return email_to_response(ai_email)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating AI research: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI research: {str(e)}"
        )

