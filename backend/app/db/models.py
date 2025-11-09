from sqlalchemy import Column, String, Float, Boolean, DateTime, Enum as SQLEnum, Text, Integer, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from .base import Base


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


class EmailStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class TransactionType(str, enum.Enum):
    CREDIT_PURCHASE = "credit_purchase"  # User bought credits
    EMAIL_RECEIVED = "email_received"    # Receiver gets 5 cents on receive
    EMAIL_RESPONDED = "email_responded"  # Receiver gets remaining amount on response
    EMAIL_SENT_DEDUCTION = "email_sent_deduction"  # Sender's credits deducted
    CASHOUT = "cashout"                  # User cashes out
    REFUND = "refund"                    # Refund transaction


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CashoutStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NotificationType(str, enum.Enum):
    PAYMENT_RECEIVED = "payment_received"  # Initial payment received
    PAYMENT_RESPONSE_AVAILABLE = "payment_response_available"  # Can earn more by responding
    REFUND_PROCESSED = "refund_processed"  # Refund was processed


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)  # For username@yesreply.tech
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    
    # Professional profile fields
    job_title = Column(String, nullable=True)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    expertise = Column(String, nullable=True)
    looking_for = Column(Text, nullable=True)  # JSON string of interests
    
    # Social links
    twitter_url = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    calendly_url = Column(String, nullable=True)
    
    # Verification fields
    linkedin_id = Column(String, unique=True, nullable=True)
    linkedin_profile_url = Column(String, nullable=True)
    linkedin_verified = Column(Boolean, default=False)
    linkedin_verification_status = Column(
        SQLEnum(VerificationStatus), 
        default=VerificationStatus.PENDING
    )
    
    # Price limit based on verifications
    price_limit = Column(Float, default=2)  # Base price limit
    
    # Wallet and payment
    wallet_balance = Column(Numeric(10, 2), default=0.00, nullable=False)  # Credits in USD
    stripe_customer_id = Column(String, nullable=True, unique=True)  # Stripe customer ID
    
    # Bank account for cashout
    bank_account_holder_name = Column(String, nullable=True)
    bank_account_last4 = Column(String, nullable=True)
    stripe_bank_account_id = Column(String, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)


class LinkedInVerification(Base):
    __tablename__ = "linkedin_verifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    linkedin_state = Column(String, unique=True, nullable=False)
    linkedin_code = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Email(Base):
    __tablename__ = "emails"

    id = Column(String, primary_key=True, index=True)
    
    # Email participants
    sent_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    received_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Email content
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    html_body = Column(Text, nullable=True)  # For HTML emails
    attachments = Column(Text, nullable=True)  # JSON string of attachment metadata [{filename, size, content_type, url}]
    
    # Thread management - enhanced for AWS SES
    original_email_id = Column(String, ForeignKey("emails.id"), nullable=True, index=True)
    thread_number = Column(Integer, default=0)  # Position in the thread (0 = original)
    thread_root_id = Column(String, index=True, nullable=True)  # Root email of the entire thread
    message_id = Column(String, unique=True, index=True, nullable=True)  # RFC 822 Message-ID for threading
    in_reply_to = Column(String, index=True, nullable=True)  # Message-ID of email being replied to
    references = Column(Text, nullable=True)  # Space-separated list of Message-IDs in thread
    
    # Payment tracking
    payment_amount = Column(Numeric(10, 2), default=0.00)  # Total amount sender paid for this email
    initial_payment_sent = Column(Boolean, default=False)  # 5 cents sent to receiver on receive
    full_payment_sent = Column(Boolean, default=False)  # Remaining amount sent on reply
    initial_payment_amount = Column(Numeric(10, 2), default=0.05)  # $0.05 on receive
    remaining_payment_amount = Column(Numeric(10, 2), default=0.00)  # Rest on reply
    refund_processed = Column(Boolean, default=False)  # Whether 48-hour refund was processed
    refund_amount = Column(Numeric(10, 2), default=0.00)  # Amount refunded to sender
    refund_processed_at = Column(DateTime(timezone=True), nullable=True)  # When refund was processed
    
    # Email metadata
    status = Column(SQLEnum(EmailStatus), default=EmailStatus.DRAFT)
    is_read = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    priority = Column(String, default="normal")  # low, normal, high
    
    # External email service references (e.g., Gmail message ID)
    external_message_id = Column(String, nullable=True, index=True)
    external_thread_id = Column(String, nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sent_by], backref="sent_emails")
    receiver = relationship("User", foreign_keys=[received_by], backref="received_emails")
    
    # Thread relationships
    parent_email = relationship("Email", remote_side=[id], foreign_keys=[original_email_id], backref="replies")


class Transaction(Base):
    """
    Tracks all financial transactions in the system.
    """
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Transaction details
    type = Column(SQLEnum(TransactionType), nullable=False)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING)
    amount = Column(Numeric(10, 2), nullable=False)  # USD amount
    balance_after = Column(Numeric(10, 2), nullable=True)  # Wallet balance after transaction
    
    # Related entities
    email_id = Column(String, ForeignKey("emails.id"), nullable=True, index=True)  # If related to an email
    payment_id = Column(String, ForeignKey("payments.id"), nullable=True)  # If related to a payment
    cashout_id = Column(String, ForeignKey("cashouts.id"), nullable=True)  # If related to a cashout
    
    # Stripe references
    stripe_payment_intent_id = Column(String, nullable=True)
    stripe_transfer_id = Column(String, nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    extra_metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="transactions")
    email = relationship("Email", backref="transactions")


class Payment(Base):
    """
    Tracks credit card payments (credit purchases).
    """
    __tablename__ = "payments"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Payment details
    amount = Column(Numeric(10, 2), nullable=False)  # USD amount
    credits_added = Column(Numeric(10, 2), nullable=False)  # Credits added to wallet
    currency = Column(String, default="usd")
    
    # Stripe details
    stripe_payment_intent_id = Column(String, unique=True, nullable=False)
    stripe_payment_method_id = Column(String, nullable=True)
    stripe_charge_id = Column(String, nullable=True)
    
    # Payment status
    status = Column(String, default="pending")  # pending, succeeded, failed
    failure_reason = Column(Text, nullable=True)
    
    # Card details (last 4 digits for display)
    card_last4 = Column(String, nullable=True)
    card_brand = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    succeeded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="payments")


class Cashout(Base):
    """
    Tracks cashout/withdrawal requests.
    """
    __tablename__ = "cashouts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Cashout details
    amount = Column(Numeric(10, 2), nullable=False)  # USD amount
    status = Column(SQLEnum(CashoutStatus), default=CashoutStatus.PENDING)
    
    # Bank account details
    bank_account_holder_name = Column(String, nullable=False)
    bank_account_last4 = Column(String, nullable=True)
    
    # Stripe details
    stripe_payout_id = Column(String, nullable=True)
    stripe_bank_account_id = Column(String, nullable=True)
    
    # Status tracking
    failure_reason = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="cashouts")


class Notification(Base):
    """
    Tracks user notifications for payment events.
    """
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Notification details
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    amount = Column(Numeric(10, 2), nullable=True)  # Amount received/refunded
    potential_amount = Column(Numeric(10, 2), nullable=True)  # Potential additional earnings
    
    # Related entities
    email_id = Column(String, ForeignKey("emails.id"), nullable=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="notifications")
    email = relationship("Email", backref="notifications")

