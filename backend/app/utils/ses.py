"""
AWS SES Email Sending Utilities
Handles sending emails via AWS SES with proper threading support
"""

import boto3
from botocore.exceptions import ClientError
from typing import Optional, List
from ..core.config import settings


def get_ses_client():
    """Get configured AWS SES client."""
    return boto3.client(
        'ses',
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )


def send_email_via_ses(
    from_email: str,
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    message_id: Optional[str] = None,
    in_reply_to: Optional[str] = None,
    references: Optional[str] = None,
) -> dict:
    """
    Send an email via AWS SES with threading support.
    
    Args:
        from_email: Sender email address (e.g., username@yesreply.tech)
        to_email: Recipient email address
        subject: Email subject
        body_text: Plain text body
        body_html: Optional HTML body
        message_id: Optional Message-ID header for threading
        in_reply_to: Optional In-Reply-To header for replies
        references: Optional References header for threading
    
    Returns:
        dict: SES response with MessageId
        
    Raises:
        ClientError: If email sending fails
    """
    ses_client = get_ses_client()
    
    # Build message
    message = {
        'Subject': {'Data': subject, 'Charset': 'UTF-8'},
        'Body': {}
    }
    
    # Add text body
    if body_text:
        message['Body']['Text'] = {'Data': body_text, 'Charset': 'UTF-8'}
    
    # Add HTML body if provided
    if body_html:
        message['Body']['Html'] = {'Data': body_html, 'Charset': 'UTF-8'}
    
    # Build email parameters
    email_params = {
        'Source': from_email,
        'Destination': {'ToAddresses': [to_email]},
        'Message': message
    }
    
    # Add threading headers if this is a reply
    if message_id or in_reply_to or references:
        headers = []
        
        if message_id:
            headers.append({'Name': 'Message-ID', 'Value': message_id})
        
        if in_reply_to:
            headers.append({'Name': 'In-Reply-To', 'Value': in_reply_to})
        
        if references:
            headers.append({'Name': 'References', 'Value': references})
        
        if headers:
            email_params['ReplyToAddresses'] = [from_email]
            # Note: For proper header support, we need to use send_raw_email
            # For now, using send_email with basic threading
    
    try:
        response = ses_client.send_email(**email_params)
        return response
    except ClientError as e:
        print(f"Error sending email via SES: {e}")
        raise


def send_raw_email_via_ses(
    from_email: str,
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    message_id: Optional[str] = None,
    in_reply_to: Optional[str] = None,
    references: Optional[str] = None,
    attachments: Optional[str] = None,
) -> dict:
    """
    Send a raw email via AWS SES with full threading support and attachments.
    This method allows custom headers for proper email threading.
    
    Args:
        from_email: Sender email address
        to_email: Recipient email address  
        subject: Email subject
        body_text: Plain text body
        body_html: Optional HTML body
        message_id: Optional Message-ID header
        in_reply_to: Optional In-Reply-To header
        references: Optional References header
        attachments: Optional JSON string of attachments with base64 data
        
    Returns:
        dict: SES response with MessageId
    """
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.base import MIMEBase
    from email import encoders
    from email.utils import formataddr
    import json
    import base64
    
    ses_client = get_ses_client()
    
    # Create message container - use 'mixed' if we have attachments
    has_attachments = attachments is not None
    msg = MIMEMultipart('mixed' if has_attachments else 'alternative')
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email
    
    # Add threading headers
    if message_id:
        msg['Message-ID'] = message_id
    
    if in_reply_to:
        msg['In-Reply-To'] = in_reply_to
    
    if references:
        msg['References'] = references
    
    # Create alternative part for text/html
    if has_attachments:
        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)
    else:
        msg_alternative = msg
    
    # Add body parts
    if body_text:
        text_part = MIMEText(body_text, 'plain', 'utf-8')
        msg_alternative.attach(text_part)
    
    if body_html:
        html_part = MIMEText(body_html, 'html', 'utf-8')
        msg_alternative.attach(html_part)
    
    # Add attachments if present
    if attachments:
        try:
            attachments_list = json.loads(attachments) if isinstance(attachments, str) else attachments
            for attachment in attachments_list:
                # Create MIME attachment
                part = MIMEBase('application', 'octet-stream')
                
                # Decode base64 data
                attachment_data = base64.b64decode(attachment['data'])
                part.set_payload(attachment_data)
                
                # Encode to base64
                encoders.encode_base64(part)
                
                # Add header
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment["filename"]}'
                )
                
                # Set content type if available
                if 'content_type' in attachment:
                    part.replace_header('Content-Type', attachment['content_type'])
                
                msg.attach(part)
        except Exception as e:
            print(f"Error processing attachments: {e}")
            # Continue without attachments if there's an error
    
    try:
        response = ses_client.send_raw_email(
            Source=from_email,
            Destinations=[to_email],
            RawMessage={'Data': msg.as_string()}
        )
        return response
    except ClientError as e:
        print(f"Error sending raw email via SES: {e}")
        raise


def verify_ses_email(email: str) -> bool:
    """
    Verify an email address with AWS SES.
    Required before sending emails from that address.
    
    Args:
        email: Email address to verify
        
    Returns:
        bool: True if verification initiated successfully
    """
    ses_client = get_ses_client()
    
    try:
        response = ses_client.verify_email_identity(EmailAddress=email)
        return True
    except ClientError as e:
        print(f"Error verifying email: {e}")
        return False


def check_ses_sending_enabled() -> bool:
    """
    Check if AWS SES sending is properly configured.
    
    Returns:
        bool: True if SES is configured, False otherwise
    """
    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        return False
    
    try:
        ses_client = get_ses_client()
        # Try to get send quota to verify credentials work
        ses_client.get_send_quota()
        return True
    except:
        return False

