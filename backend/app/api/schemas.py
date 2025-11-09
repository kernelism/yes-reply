from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ==================== Auth Schemas ====================

class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ==================== User Schemas ====================

class UserCreate(BaseModel):
    email: str
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r"^[a-z0-9_-]+$")  # Optional, backend generates if not provided
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r"^[a-z0-9_-]+$")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    password: Optional[str] = Field(None, min_length=8)
    # Professional fields
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    looking_for: Optional[List[str]] = None  # Array of interests
    # Social links
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    calendly_url: Optional[str] = None
    # Price limit
    price_limit: Optional[float] = None


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    yesreply_email: Optional[str] = None  # Computed: username@yesreply.tech
    first_name: str
    last_name: str
    description: Optional[str] = None
    # Professional fields
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    looking_for: Optional[str] = None  # JSON string
    # Social links
    linkedin_profile_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    calendly_url: Optional[str] = None
    # Verification and limits
    linkedin_verified: bool
    price_limit: float
    wallet_balance: float = 0.00
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== LinkedIn Verification Schemas ====================

class LinkedInAuthURLResponse(BaseModel):
    authorization_url: str
    state: str


class LinkedInCallbackRequest(BaseModel):
    code: str
    state: str


class LinkedInVerificationResponse(BaseModel):
    message: str
    linkedin_verified: bool
    linkedin_profile_url: Optional[str] = None
    new_price_limit: float


# ==================== Generic Response ====================

class MessageResponse(BaseModel):
    message: str
    success: bool = True


# ==================== Email Schemas ====================

class EmailStatusEnum(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class EmailPriorityEnum(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


class EmailCreate(BaseModel):
    received_by: str  # User ID or email address of recipient
    subject: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1)
    html_body: Optional[str] = None
    attachments: Optional[str] = None  # JSON string of attachment metadata
    original_email_id: Optional[str] = None  # ID of email being replied to
    priority: EmailPriorityEnum = EmailPriorityEnum.NORMAL
    payment_amount: Optional[float] = Field(None, ge=0.05, description="Payment amount in USD (minimum $0.05)")


class EmailReply(BaseModel):
    body: str = Field(..., min_length=1)
    html_body: Optional[str] = None
    attachments: Optional[str] = None  # JSON string of attachment metadata with base64 data


class EmailUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = Field(None, min_length=1)
    html_body: Optional[str] = None
    status: Optional[EmailStatusEnum] = None
    is_read: Optional[bool] = None
    is_starred: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_deleted: Optional[bool] = None
    priority: Optional[EmailPriorityEnum] = None


class EmailResponse(BaseModel):
    id: str
    sent_by: str
    received_by: str
    sender_email: Optional[str] = None
    receiver_email: Optional[str] = None
    sender_username: Optional[str] = None
    receiver_username: Optional[str] = None
    subject: str
    body: str
    html_body: Optional[str] = None
    attachments: Optional[str] = None  # JSON string of attachment metadata
    
    # Thread information
    original_email_id: Optional[str] = None
    thread_number: int
    thread_root_id: Optional[str] = None
    message_id: Optional[str] = None
    in_reply_to: Optional[str] = None
    references: Optional[str] = None
    
    # Metadata
    status: str
    is_read: bool
    is_starred: bool
    is_archived: bool
    is_deleted: bool
    priority: str
    
    # External references
    external_message_id: Optional[str] = None
    external_thread_id: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailThreadResponse(BaseModel):
    """Response containing an email and its thread context"""
    email: EmailResponse
    thread_emails: List[EmailResponse]  # All emails in the thread
    reply_count: int


class EmailListResponse(BaseModel):
    """Paginated email list response"""
    emails: List[EmailResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class BulkEmailOperation(BaseModel):
    """Schema for bulk email operations"""
    email_ids: List[str] = Field(..., min_items=1)


class BulkArchiveRequest(BaseModel):
    """Schema for bulk archive operation"""
    email_ids: List[str] = Field(..., min_items=1)
    archived: bool = True


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete operation"""
    email_ids: List[str] = Field(..., min_items=1)
    permanent: bool = False


class BulkStarRequest(BaseModel):
    """Schema for bulk star operation"""
    email_ids: List[str] = Field(..., min_items=1)
    starred: bool = True


class ForwardEmailRequest(BaseModel):
    """Schema for forwarding an email thread"""
    forward_to: str = Field(..., description="Email address to forward to")
    message: Optional[str] = Field(None, description="Optional message to include with forward")


# ==================== Payment Schemas ====================

class PaymentIntentCreate(BaseModel):
    """Create a payment intent to add credits"""
    amount: float = Field(..., gt=0, description="Amount in USD to charge")
    
    
class PaymentIntentResponse(BaseModel):
    """Payment intent response with client secret"""
    payment_intent_id: str
    client_secret: str
    amount: float
    publishable_key: str


class PaymentConfirm(BaseModel):
    """Confirm a payment and add credits"""
    payment_intent_id: str


class TransactionTypeEnum(str, Enum):
    CREDIT_PURCHASE = "credit_purchase"
    EMAIL_RECEIVED = "email_received"
    EMAIL_RESPONDED = "email_responded"
    EMAIL_SENT_DEDUCTION = "email_sent_deduction"
    CASHOUT = "cashout"
    REFUND = "refund"


class TransactionStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TransactionResponse(BaseModel):
    """Transaction record response"""
    id: str
    user_id: str
    type: str
    status: str
    amount: float
    balance_after: Optional[float] = None
    email_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    """Payment record response"""
    id: str
    user_id: str
    amount: float
    credits_added: float
    status: str
    card_last4: Optional[str] = None
    card_brand: Optional[str] = None
    created_at: datetime
    succeeded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CashoutStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CashoutCreate(BaseModel):
    """Create a cashout request"""
    amount: float = Field(..., gt=0, description="Amount in USD to cash out")
    bank_account_holder_name: str = Field(..., min_length=1)
    bank_routing_number: str = Field(..., pattern=r"^\d{9}$")
    bank_account_number: str = Field(..., min_length=4)


class CashoutResponse(BaseModel):
    """Cashout record response"""
    id: str
    user_id: str
    amount: float
    status: str
    bank_account_holder_name: str
    bank_account_last4: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class WalletResponse(BaseModel):
    """Wallet information response"""
    balance: float
    total_earned: float
    total_spent: float
    total_cashed_out: float
    pending_cashouts: float


# ==================== Notification Schemas ====================

class NotificationTypeEnum(str, Enum):
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_RESPONSE_AVAILABLE = "payment_response_available"
    REFUND_PROCESSED = "refund_processed"


class NotificationResponse(BaseModel):
    """Notification response"""
    id: str
    user_id: str
    type: str
    title: str
    message: str
    amount: Optional[float] = None
    potential_amount: Optional[float] = None
    email_id: Optional[str] = None
    transaction_id: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    """Mark notification(s) as read"""
    notification_ids: List[str] = Field(..., min_items=1)


class NotificationListResponse(BaseModel):
    """Paginated notification list response"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    page_size: int
    has_more: bool

