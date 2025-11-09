from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import uuid

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
    ForwardEmailRequest
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

