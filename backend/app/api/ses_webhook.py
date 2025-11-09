from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
import uuid
from datetime import datetime
from email.parser import Parser
from email.policy import default
import re

from ..db.session import get_db
from ..db.models import Email, User, EmailStatus
from .schemas import EmailResponse, MessageResponse

router = APIRouter(prefix="/ses", tags=["ses-webhook"])


def extract_username_from_email(email_address: str) -> Optional[str]:
    """Extract username from email address (username@yesreply.tech)."""
    if "@yesreply.tech" in email_address.lower():
        return email_address.split("@")[0].lower()
    return None


def parse_email_headers(headers: list) -> Dict[str, str]:
    """Parse email headers from SES format."""
    header_dict = {}
    for header in headers:
        name = header.get("name", "").lower()
        value = header.get("value", "")
        header_dict[name] = value
    return header_dict


def extract_text_from_email(content: str) -> tuple[str, Optional[str]]:
    """Extract plain text and HTML from email content."""
    parser = Parser(policy=default)
    msg = parser.parsestr(content)
    
    text_body = None
    html_body = None
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain" and not text_body:
                text_body = part.get_content()
            elif content_type == "text/html" and not html_body:
                html_body = part.get_content()
    else:
        content_type = msg.get_content_type()
        if content_type == "text/plain":
            text_body = msg.get_content()
        elif content_type == "text/html":
            html_body = msg.get_content()
    
    return text_body or "No content", html_body


@router.post("/incoming", response_model=MessageResponse)
async def receive_ses_email(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for receiving emails from AWS SES.
    
    AWS SES sends emails via SNS, which can be configured to POST to this endpoint.
    
    Flow:
    1. SES receives email at username@yesreply.tech
    2. SES forwards to SNS topic
    3. SNS POSTs to this endpoint
    4. We parse and store the email
    
    Security:
    - Only accepts emails from @yesreply.tech domain
    - Validates sender and recipient exist in system
    """
    try:
        print("\n" + "="*80)
        print("[SES WEBHOOK] Received incoming request")
        print("="*80)
        
        body = await request.json()
        print(f"[SES WEBHOOK] Request body keys: {list(body.keys())}")
        print(f"[SES WEBHOOK] Request body type (SNS): {body.get('Type')}")
        
        # Handle SNS subscription confirmation
        if body.get("Type") == "SubscriptionConfirmation":
            print("[SES WEBHOOK] SNS Subscription confirmation detected")
            print(f"[SES WEBHOOK] SubscribeURL: {body.get('SubscribeURL')}")
            # In production, you should verify the subscription
            # For now, return success and manually confirm via AWS Console
            return MessageResponse(
                message="SNS Subscription confirmation received. Please confirm via AWS Console.",
                success=True
            )
        
        # Determine if this is a direct SNS notification or pre-parsed message from Cloudflare Worker
        message_data = None
        
        if body.get("Type") == "Notification":
            # Full SNS notification wrapper
            print("[SES WEBHOOK] Format: Full SNS Notification wrapper")
            message_data = json.loads(body.get("Message", "{}"))
        elif "mail" in body and "receipt" in body:
            # Pre-parsed SES message (forwarded by Cloudflare Worker or similar)
            print("[SES WEBHOOK] Format: Pre-parsed SES message (from Cloudflare Worker)")
            message_data = body
        elif "mail" in body:
            # Partial SES message with just mail data
            print("[SES WEBHOOK] Format: Partial SES message with mail data")
            message_data = body
        else:
            print(f"[SES WEBHOOK] WARNING: Unrecognized format. Body keys: {list(body.keys())}")
            return MessageResponse(
                message=f"Unrecognized message format. Keys: {list(body.keys())}",
                success=False
            )
        
        if message_data:
            print("[SES WEBHOOK] Processing incoming email")
            print(f"[SES WEBHOOK] Message data keys: {list(message_data.keys())}")
            
            # Extract email data from SES notification
            mail = message_data.get("mail", {})
            receipt = message_data.get("receipt", {})
            content = message_data.get("content", "")
            
            print(f"[SES WEBHOOK] Mail data present: {bool(mail)}")
            print(f"[SES WEBHOOK] Receipt data present: {bool(receipt)}")
            print(f"[SES WEBHOOK] Content length: {len(content)} chars")
            
            # Get sender and recipients
            # Try commonHeaders first (more reliable), fall back to source/destination
            common_headers = mail.get("commonHeaders", {})
            source = common_headers.get("from", [mail.get("source", "")])[0] if isinstance(common_headers.get("from"), list) else common_headers.get("from", mail.get("source", ""))
            destination = common_headers.get("to", mail.get("destination", []))
            
            # If source is still wrapped in angle brackets or has name, extract email
            if "<" in source and ">" in source:
                source = source.split("<")[1].split(">")[0]
            
            print(f"[SES WEBHOOK] From: {source}")
            print(f"[SES WEBHOOK] To: {destination}")
            
            if not destination:
                print("[SES WEBHOOK] ERROR: No recipients found in email")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No recipients found in email"
                )
            
            # Extract headers - prefer commonHeaders, fall back to headers array
            subject = common_headers.get("subject", "No Subject")
            
            # Parse detailed headers for threading info (do this FIRST to get RFC 822 headers)
            headers = mail.get("headers", [])
            header_dict = parse_email_headers(headers)
            
            # Get Message-ID - PREFER the RFC 822 Message-ID header over SES messageId
            # The RFC 822 Message-ID is what we set when sending emails from our system
            message_id = header_dict.get("message-id")
            if not message_id:
                # Fall back to SES messageId if RFC 822 header not found
                message_id = common_headers.get("messageId", mail.get("messageId", f"<{uuid.uuid4()}@yesreply.tech>"))
            
            # Override subject with parsed header if needed
            if not subject or subject == "No Subject":
                subject = header_dict.get("subject", "No Subject")
            
            in_reply_to = header_dict.get("in-reply-to")
            references = header_dict.get("references")
            
            # CRITICAL: Check if email with this message_id already exists (prevents duplicates from internal sends)
            # AWS SES generates its own Message-ID, so we need to check multiple ways:
            # 1. Check if the Message-ID matches any existing message_id
            # 2. Check if the SES MessageId matches any existing external_message_id
            # 3. Check for recent emails with same sender/recipient/subject (fallback for internal emails)
            
            existing_email = None
            
            # Method 1: Check by message_id
            if message_id:
                existing_email = db.query(Email).filter(Email.message_id == message_id).first()
                if existing_email:
                    print(f"[SES WEBHOOK] Email with message_id {message_id} already exists (ID: {existing_email.id}), skipping duplicate creation")
                    return MessageResponse(
                        message=f"Email already exists with message_id: {message_id}",
                        success=True
                    )
            
            # Method 2: Extract SES MessageId from the Message-ID header and check external_message_id
            # SES Message-ID format: <ses-id-part@email.amazonses.com> or <ses-id-part@amazonses.com>
            if message_id and ("@email.amazonses.com>" in message_id or "@amazonses.com>" in message_id):
                # Extract the SES MessageId part (before the @)
                ses_message_id = message_id.lstrip("<").split("@")[0]
                print(f"[SES WEBHOOK] Extracted SES MessageId: {ses_message_id}")
                
                # Check if any email has this as external_message_id
                existing_email = db.query(Email).filter(Email.external_message_id == ses_message_id).first()
                if existing_email:
                    print(f"[SES WEBHOOK] Email with external_message_id {ses_message_id} already exists (ID: {existing_email.id}), skipping duplicate creation")
                    return MessageResponse(
                        message=f"Email already exists with external_message_id: {ses_message_id}",
                        success=True
                    )
            
            # Method 3: For internal @yesreply.tech to @yesreply.tech emails, check for recent email with same details
            # This catches cases where SES completely replaces our Message-ID
            if "@yesreply.tech" in source.lower() and destination:
                from datetime import timedelta
                recent_time = datetime.utcnow() - timedelta(minutes=5)  # Look for emails sent in last 5 minutes
                
                # Get sender
                sender_username = extract_username_from_email(source)
                sender = None
                if sender_username:
                    sender = db.query(User).filter(User.username == sender_username).first()
                
                # Check each destination
                for dest in destination:
                    recipient_username = extract_username_from_email(dest)
                    recipient = None
                    if recipient_username:
                        recipient = db.query(User).filter(User.username == recipient_username).first()
                    
                    if sender and recipient:
                        # Look for recent email with same sender, recipient, and subject
                        existing_email = db.query(Email).filter(
                            Email.sent_by == sender.id,
                            Email.received_by == recipient.id,
                            Email.subject == subject,
                            Email.created_at >= recent_time,
                            Email.status.in_([EmailStatus.SENT.value, EmailStatus.DELIVERED.value])
                        ).first()
                        
                        if existing_email:
                            print(f"[SES WEBHOOK] Found recent internal email (ID: {existing_email.id}) with same sender/recipient/subject, skipping duplicate")
                            # Update the existing email with the SES external_message_id if we have it
                            if message_id and ("@email.amazonses.com>" in message_id or "@amazonses.com>" in message_id):
                                ses_message_id = message_id.lstrip("<").split("@")[0]
                                if not existing_email.external_message_id:
                                    existing_email.external_message_id = ses_message_id
                                    db.commit()
                                    print(f"[SES WEBHOOK] Updated existing email with external_message_id: {ses_message_id}")
                            
                            return MessageResponse(
                                message=f"Email already exists (recent internal send), skipping duplicate",
                                success=True
                            )
            
            print(f"[SES WEBHOOK] Subject: {subject}")
            print(f"[SES WEBHOOK] Message-ID: {message_id}")
            print(f"[SES WEBHOOK] In-Reply-To: {in_reply_to}")
            print(f"[SES WEBHOOK] References: {references}")
            
            # Extract sender username
            sender_username = extract_username_from_email(source)
            print(f"[SES WEBHOOK] Sender username from email: {sender_username}")
            
            # SECURITY: Only accept emails from @yesreply.tech domain
            if not sender_username:
                print(f"[SES WEBHOOK] REJECTED: Email from non-yesreply.tech domain: {source}")
                return MessageResponse(
                    message=f"Email rejected: Only @yesreply.tech emails are accepted. Received from: {source}",
                    success=False
                )
            
            # Find sender in database
            # If sender has yesreply.tech username, use that; otherwise try to find by email
            sender = None
            if sender_username:
                print(f"[SES WEBHOOK] Looking up sender by username: {sender_username}")
                sender = db.query(User).filter(User.username == sender_username).first()
            
            if not sender:
                # Try to find by email address (for non-yesreply.tech domains)
                print(f"[SES WEBHOOK] Looking up sender by email: {source}")
                sender = db.query(User).filter(User.email == source).first()
            
            if not sender:
                print(f"[SES WEBHOOK] ERROR: Sender not found in database: {source}")
                return MessageResponse(
                    message=f"Sender not found in database: {source}",
                    success=False
                )
            
            print(f"[SES WEBHOOK] Sender found: {sender.username} (ID: {sender.id})")
            
            # Process each recipient
            print(f"[SES WEBHOOK] Processing {len(destination)} recipient(s)")
            
            for idx, recipient_email in enumerate(destination):
                print(f"\n[SES WEBHOOK] --- Processing recipient #{idx+1}: {recipient_email} ---")
                
                recipient_username = extract_username_from_email(recipient_email)
                print(f"[SES WEBHOOK] Recipient username from email: {recipient_username}")
                
                # TEMPORARY: Allow emails to all domains
                # To enable strict domain checking, uncomment:
                """
                if not recipient_username:
                    continue  # Skip non-yesreply.tech recipients
                """
                
                # Find recipient in database
                recipient = None
                if recipient_username:
                    print(f"[SES WEBHOOK] Looking up recipient by username: {recipient_username}")
                    recipient = db.query(User).filter(User.username == recipient_username).first()
                
                if not recipient:
                    # Try to find by email address (for non-yesreply.tech domains)
                    print(f"[SES WEBHOOK] Looking up recipient by email: {recipient_email}")
                    recipient = db.query(User).filter(User.email == recipient_email).first()
                
                if not recipient:
                    print(f"[SES WEBHOOK] WARNING: Recipient not found, skipping: {recipient_email}")
                    continue  # Skip if recipient not found
                
                print(f"[SES WEBHOOK] Recipient found: {recipient.username} (ID: {recipient.id})")
                
                # Extract email body
                print("[SES WEBHOOK] Extracting email body content...")
                text_body, html_body = extract_text_from_email(content)
                print(f"[SES WEBHOOK] Text body length: {len(text_body) if text_body else 0} chars")
                print(f"[SES WEBHOOK] HTML body: {'Present' if html_body else 'None'}")
                
                # Check if this is a reply (has in_reply_to header)
                original_email_id = None
                thread_root_id = None
                thread_number = 0
                
                print("[SES WEBHOOK] Analyzing email threading...")
                
                if in_reply_to:
                    print(f"[SES WEBHOOK] This is a REPLY (In-Reply-To: {in_reply_to})")
                    # Try to find the original email by message_id
                    original_email = db.query(Email).filter(
                        Email.message_id == in_reply_to
                    ).first()
                    
                    if original_email:
                        original_email_id = original_email.id
                        thread_root_id = original_email.thread_root_id or original_email.id
                        
                        # Calculate thread number
                        thread_number = db.query(Email).filter(
                            Email.thread_root_id == thread_root_id
                        ).count()
                        
                        print(f"[SES WEBHOOK] Found original email: {original_email.id}")
                        print(f"[SES WEBHOOK] Thread root ID: {thread_root_id}")
                        print(f"[SES WEBHOOK] Thread number: {thread_number}")
                    else:
                        print(f"[SES WEBHOOK] WARNING: Original email not found for In-Reply-To: {in_reply_to}")
                else:
                    print("[SES WEBHOOK] This is a NEW conversation (no In-Reply-To header)")
                
                # Create email record
                email_id = str(uuid.uuid4())
                print(f"[SES WEBHOOK] Creating email record with ID: {email_id}")
                
                email = Email(
                    id=email_id,
                    sent_by=sender.id,
                    received_by=recipient.id,
                    subject=subject,
                    body=text_body,
                    html_body=html_body,
                    original_email_id=original_email_id,
                    thread_number=thread_number,
                    thread_root_id=thread_root_id,
                    message_id=message_id,
                    in_reply_to=in_reply_to,
                    references=references,
                    status=EmailStatus.DELIVERED.value,
                    is_read=False,
                    delivered_at=datetime.utcnow()
                )
                
                db.add(email)
                print(f"[SES WEBHOOK] Email record added to database session")
            
            print("[SES WEBHOOK] Committing all email records to database...")
            db.commit()
            print("[SES WEBHOOK] SUCCESS: Email(s) committed to database")
            
            print("="*80)
            print("[SES WEBHOOK] Email processing completed successfully")
            print("="*80 + "\n")
            
            return MessageResponse(
                message="Email received and processed successfully",
                success=True
            )
        
        # If we got here, no message was processed
        print(f"[SES WEBHOOK] WARNING: No message processed")
        return MessageResponse(
            message=f"No message processed. Body keys: {list(body.keys())}",
            success=False
        )
        
    except json.JSONDecodeError as e:
        print(f"[SES WEBHOOK] ERROR: JSON decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON in request body"
        )
    except Exception as e:
        print(f"[SES WEBHOOK] ERROR: Exception occurred: {str(e)}")
        print(f"[SES WEBHOOK] Exception type: {type(e).__name__}")
        import traceback
        print(f"[SES WEBHOOK] Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing email: {str(e)}"
        )


@router.post("/test-incoming", response_model=MessageResponse)
async def test_incoming_email(
    sender_username: str,
    recipient_username: str,
    subject: str,
    body: str,
    in_reply_to_email_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Test endpoint to simulate receiving an email from SES.
    Useful for development and testing without setting up SES.
    """
    # Find sender
    sender = db.query(User).filter(User.username == sender_username.lower()).first()
    if not sender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sender username not found: {sender_username}"
        )
    
    # Find recipient
    recipient = db.query(User).filter(User.username == recipient_username.lower()).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipient username not found: {recipient_username}"
        )
    
    # Calculate thread information
    original_email = None
    thread_root_id = None
    thread_number = 0
    message_id = f"<{uuid.uuid4()}@yesreply.tech>"
    in_reply_to = None
    
    if in_reply_to_email_id:
        original_email = db.query(Email).filter(Email.id == in_reply_to_email_id).first()
        if original_email:
            in_reply_to = original_email.message_id
            thread_root_id = original_email.thread_root_id or original_email.id
            thread_number = db.query(Email).filter(
                Email.thread_root_id == thread_root_id
            ).count()
    
    # Create email
    email = Email(
        id=str(uuid.uuid4()),
        sent_by=sender.id,
        received_by=recipient.id,
        subject=subject,
        body=body,
        html_body=None,
        original_email_id=in_reply_to_email_id,
        thread_number=thread_number,
        thread_root_id=thread_root_id,
        message_id=message_id,
        in_reply_to=in_reply_to,
        status=EmailStatus.DELIVERED.value,
        is_read=False,
        delivered_at=datetime.utcnow()
    )
    
    db.add(email)
    db.commit()
    db.refresh(email)
    
    return MessageResponse(
        message=f"Test email created successfully with ID: {email.id}",
        success=True
    )

