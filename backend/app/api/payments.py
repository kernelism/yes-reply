"""
Payment API endpoints for YesReply.
Handles credit purchases, transactions, and cashouts via Stripe.
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
import stripe
import uuid
import logging
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger(__name__)

from ..db.session import get_db
from ..db.models import (
    User, Transaction, Payment, Cashout,
    TransactionType, TransactionStatus, CashoutStatus
)
from ..core.config import settings
from ..core.security import get_current_user
from .schemas import (
    PaymentIntentCreate, PaymentIntentResponse, PaymentConfirm,
    TransactionResponse, PaymentResponse, CashoutCreate, CashoutResponse,
    WalletResponse, MessageResponse
)

router = APIRouter(prefix="/payments", tags=["payments"])

# Initialize Stripe
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


# ==================== Helper Functions ====================

def create_transaction(
    db: Session,
    user_id: str,
    transaction_type: TransactionType,
    amount: Decimal,
    status: TransactionStatus = TransactionStatus.COMPLETED,
    email_id: Optional[str] = None,
    payment_id: Optional[str] = None,
    cashout_id: Optional[str] = None,
    description: Optional[str] = None,
    stripe_payment_intent_id: Optional[str] = None,
    stripe_transfer_id: Optional[str] = None
) -> Transaction:
    """Create a transaction record."""
    # Get current balance
    user = db.query(User).filter(User.id == user_id).first()
    
    transaction = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=transaction_type,
        status=status,
        amount=amount,
        balance_after=user.wallet_balance if user else None,
        email_id=email_id,
        payment_id=payment_id,
        cashout_id=cashout_id,
        description=description,
        stripe_payment_intent_id=stripe_payment_intent_id,
        stripe_transfer_id=stripe_transfer_id
    )
    
    db.add(transaction)
    return transaction


def update_wallet_balance(db: Session, user_id: str, amount: Decimal) -> User:
    """Update user's wallet balance."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.wallet_balance = (user.wallet_balance or Decimal(0)) + amount
    
    # Ensure balance doesn't go negative
    if user.wallet_balance < 0:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    db.commit()
    db.refresh(user)
    return user


def get_or_create_stripe_customer(db: Session, user: User) -> str:
    """Get or create a Stripe customer for the user."""
    if user.stripe_customer_id:
        logger.info(f"[PAYMENTS] Using existing Stripe customer: {user.stripe_customer_id}")
        return user.stripe_customer_id
    
    try:
        logger.info(f"[PAYMENTS] Creating new Stripe customer for user {user.id}")
        customer = stripe.Customer.create(
            email=user.email,
            name=f"{user.first_name} {user.last_name}",
            metadata={
                "user_id": user.id,
                "username": user.username
            }
        )
        
        logger.info(f"[PAYMENTS] Stripe customer created: {customer.id}")
        user.stripe_customer_id = customer.id
        db.commit()
        
        return customer.id
    except stripe.error.StripeError as e:
        logger.error(f"[PAYMENTS] Stripe error creating customer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"[PAYMENTS] Unexpected error creating customer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ==================== Wallet Endpoints ====================

@router.get("/wallet", response_model=WalletResponse)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's wallet information."""
    logger.info(f"[PAYMENTS] Wallet request from user: {current_user.id} ({current_user.email})")
    # Calculate totals
    total_earned = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type.in_([
            TransactionType.EMAIL_RECEIVED,
            TransactionType.EMAIL_RESPONDED
        ]),
        Transaction.status == TransactionStatus.COMPLETED
    ).scalar() or Decimal(0)
    
    total_spent = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EMAIL_SENT_DEDUCTION,
        Transaction.status == TransactionStatus.COMPLETED
    ).scalar() or Decimal(0)
    
    total_cashed_out = db.query(func.sum(Cashout.amount)).filter(
        Cashout.user_id == current_user.id,
        Cashout.status == CashoutStatus.COMPLETED
    ).scalar() or Decimal(0)
    
    pending_cashouts = db.query(func.sum(Cashout.amount)).filter(
        Cashout.user_id == current_user.id,
        Cashout.status.in_([CashoutStatus.PENDING, CashoutStatus.PROCESSING])
    ).scalar() or Decimal(0)
    
    return WalletResponse(
        balance=float(current_user.wallet_balance or 0),
        total_earned=float(total_earned),
        total_spent=float(abs(total_spent)),
        total_cashed_out=float(total_cashed_out),
        pending_cashouts=float(pending_cashouts)
    )


# ==================== Payment Intent Endpoints ====================

@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe payment intent to add credits."""
    logger.info(f"[PAYMENTS] Creating payment intent for user {current_user.id}, amount: ${payment_data.amount}")
    
    if not settings.STRIPE_SECRET_KEY:
        logger.error("[PAYMENTS] Stripe secret key not configured")
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    
    if payment_data.amount < 1:
        logger.warning(f"[PAYMENTS] Invalid amount: {payment_data.amount}")
        raise HTTPException(status_code=400, detail="Minimum payment amount is $1")
    
    try:
        logger.info(f"[PAYMENTS] Getting or creating Stripe customer for user {current_user.id}")
        # Get or create Stripe customer
        customer_id = get_or_create_stripe_customer(db, current_user)
        logger.info(f"[PAYMENTS] Stripe customer ID: {customer_id}")
        
        # Create payment intent
        logger.info(f"[PAYMENTS] Creating Stripe PaymentIntent for ${payment_data.amount}")
        intent = stripe.PaymentIntent.create(
            amount=int(payment_data.amount * 100),  # Convert to cents
            currency="usd",
            customer=customer_id,
            metadata={
                "user_id": current_user.id,
                "username": current_user.username,
                "credits_to_add": str(payment_data.amount)
            },
            automatic_payment_methods={
                "enabled": True,
            }
        )
        
        logger.info(f"[PAYMENTS] PaymentIntent created successfully: {intent.id}")
        
        response_data = PaymentIntentResponse(
            payment_intent_id=intent.id,
            client_secret=intent.client_secret,
            amount=payment_data.amount,
            publishable_key=settings.STRIPE_PUBLISHABLE_KEY or ""
        )
        logger.info(f"[PAYMENTS] Returning payment intent response: {response_data.payment_intent_id}")
        return response_data
        
    except stripe.error.StripeError as e:
        logger.error(f"[PAYMENTS] Stripe error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"[PAYMENTS] Unexpected error creating payment intent: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/confirm-payment", response_model=PaymentResponse)
async def confirm_payment(
    payment_confirm: PaymentConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm a payment and add credits to user's wallet."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    
    try:
        # Retrieve the payment intent with expanded charges
        intent = stripe.PaymentIntent.retrieve(
            payment_confirm.payment_intent_id,
            expand=['charges']
        )
        
        logger.info(f"[PAYMENTS] Retrieved payment intent: {intent.id}, status: {intent.status}")
        
        # Check if payment was successful
        if intent.status != "succeeded":
            raise HTTPException(
                status_code=400,
                detail=f"Payment not successful. Status: {intent.status}"
            )
        
        # Check if this payment was already processed
        existing_payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == intent.id
        ).first()
        
        if existing_payment:
            logger.info(f"[PAYMENTS] Payment already processed: {existing_payment.id}")
            return PaymentResponse(
                id=existing_payment.id,
                user_id=existing_payment.user_id,
                amount=float(existing_payment.amount),
                credits_added=float(existing_payment.credits_added),
                status=existing_payment.status,
                card_last4=existing_payment.card_last4,
                card_brand=existing_payment.card_brand,
                created_at=existing_payment.created_at,
                succeeded_at=existing_payment.succeeded_at
            )
        
        # Get amount
        amount = Decimal(intent.amount) / 100  # Convert from cents
        
        # Get charge ID if available (charges structure varies by Stripe API version)
        charge_id = None
        try:
            # Try latest_charge (newer API versions)
            if hasattr(intent, 'latest_charge') and intent.latest_charge:
                charge_id = intent.latest_charge
            # Try charges.data (older API versions)
            elif hasattr(intent, 'charges') and intent.charges:
                if hasattr(intent.charges, 'data') and intent.charges.data and len(intent.charges.data) > 0:
                    charge_id = intent.charges.data[0].id
                elif isinstance(intent.charges, list) and len(intent.charges) > 0:
                    charge_id = intent.charges[0].id if isinstance(intent.charges[0], str) else intent.charges[0].id
        except Exception as e:
            logger.warning(f"[PAYMENTS] Could not extract charge ID: {str(e)}")
            # Charge ID is optional, continue without it
        
        # Create payment record
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=amount,
            credits_added=amount,  # 1:1 ratio
            stripe_payment_intent_id=intent.id,
            stripe_payment_method_id=intent.payment_method if hasattr(intent, 'payment_method') else None,
            stripe_charge_id=charge_id,
            status="succeeded",
            succeeded_at=datetime.utcnow()
        )
        
        # Get card details if available
        if intent.payment_method:
            try:
                pm = stripe.PaymentMethod.retrieve(intent.payment_method)
                if pm.card:
                    payment.card_last4 = pm.card.last4
                    payment.card_brand = pm.card.brand
            except Exception as e:
                logger.warning(f"[PAYMENTS] Could not retrieve payment method: {str(e)}")
        
        db.add(payment)
        db.flush()
        
        # Add credits to wallet
        update_wallet_balance(db, current_user.id, amount)
        
        # Create transaction record
        create_transaction(
            db=db,
            user_id=current_user.id,
            transaction_type=TransactionType.CREDIT_PURCHASE,
            amount=amount,
            status=TransactionStatus.COMPLETED,
            payment_id=payment.id,
            description=f"Credit purchase via card ending in {payment.card_last4}",
            stripe_payment_intent_id=intent.id
        )
        
        db.commit()
        db.refresh(payment)
        
        return PaymentResponse(
            id=payment.id,
            user_id=payment.user_id,
            amount=float(payment.amount),
            credits_added=float(payment.credits_added),
            status=payment.status,
            card_last4=payment.card_last4,
            card_brand=payment.card_brand,
            created_at=payment.created_at,
            succeeded_at=payment.succeeded_at
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"[PAYMENTS] Stripe error confirming payment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"[PAYMENTS] Unexpected error confirming payment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ==================== Transaction Endpoints ====================

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's transaction history."""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(desc(Transaction.created_at)).limit(limit).offset(offset).all()
    
    return [
        TransactionResponse(
            id=t.id,
            user_id=t.user_id,
            type=t.type.value,
            status=t.status.value,
            amount=float(t.amount),
            balance_after=float(t.balance_after) if t.balance_after else None,
            email_id=t.email_id,
            description=t.description,
            created_at=t.created_at
        )
        for t in transactions
    ]


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific transaction."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return TransactionResponse(
        id=transaction.id,
        user_id=transaction.user_id,
        type=transaction.type.value,
        status=transaction.status.value,
        amount=float(transaction.amount),
        balance_after=float(transaction.balance_after) if transaction.balance_after else None,
        email_id=transaction.email_id,
        description=transaction.description,
        created_at=transaction.created_at
    )


# ==================== Payment History Endpoints ====================

@router.get("/payment-history", response_model=List[PaymentResponse])
async def get_payment_history(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's payment history."""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(desc(Payment.created_at)).limit(limit).offset(offset).all()
    
    return [
        PaymentResponse(
            id=p.id,
            user_id=p.user_id,
            amount=float(p.amount),
            credits_added=float(p.credits_added),
            status=p.status,
            card_last4=p.card_last4,
            card_brand=p.card_brand,
            created_at=p.created_at,
            succeeded_at=p.succeeded_at
        )
        for p in payments
    ]


# ==================== Cashout Endpoints ====================

@router.post("/cashout", response_model=CashoutResponse)
async def create_cashout(
    cashout_data: CashoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request a cashout/withdrawal."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    
    # Validate minimum cashout amount
    if cashout_data.amount < settings.MIN_CASHOUT_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum cashout amount is ${settings.MIN_CASHOUT_AMOUNT}"
        )
    
    # Check if user has sufficient balance
    if current_user.wallet_balance < Decimal(str(cashout_data.amount)):
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    # Check for pending cashouts
    pending_cashouts = db.query(Cashout).filter(
        Cashout.user_id == current_user.id,
        Cashout.status.in_([CashoutStatus.PENDING, CashoutStatus.PROCESSING])
    ).count()
    
    if pending_cashouts > 0:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending cashout request"
        )
    
    try:
        # Get or create Stripe customer
        customer_id = get_or_create_stripe_customer(db, current_user)
        
        # Get last 4 digits of account
        account_last4 = cashout_data.bank_account_number[-4:]
        
        # Create bank account token (in production, this should be done on frontend)
        # For now, we'll just store the information and mark as pending
        # Admin will process manually or via Stripe Connect
        
        # Create cashout record
        cashout = Cashout(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=Decimal(str(cashout_data.amount)),
            status=CashoutStatus.PENDING,
            bank_account_holder_name=cashout_data.bank_account_holder_name,
            bank_account_last4=account_last4
        )
        
        db.add(cashout)
        db.flush()
        
        # Deduct from wallet immediately
        update_wallet_balance(db, current_user.id, -Decimal(str(cashout_data.amount)))
        
        # Create transaction record
        create_transaction(
            db=db,
            user_id=current_user.id,
            transaction_type=TransactionType.CASHOUT,
            amount=-Decimal(str(cashout_data.amount)),
            status=TransactionStatus.PENDING,
            cashout_id=cashout.id,
            description=f"Cashout to {cashout_data.bank_account_holder_name} (****{account_last4})"
        )
        
        db.commit()
        db.refresh(cashout)
        
        return CashoutResponse(
            id=cashout.id,
            user_id=cashout.user_id,
            amount=float(cashout.amount),
            status=cashout.status.value,
            bank_account_holder_name=cashout.bank_account_holder_name,
            bank_account_last4=cashout.bank_account_last4,
            failure_reason=cashout.failure_reason,
            created_at=cashout.created_at,
            completed_at=cashout.completed_at
        )
        
    except stripe.error.StripeError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")


@router.get("/cashouts", response_model=List[CashoutResponse])
async def get_cashouts(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's cashout history."""
    cashouts = db.query(Cashout).filter(
        Cashout.user_id == current_user.id
    ).order_by(desc(Cashout.created_at)).limit(limit).offset(offset).all()
    
    return [
        CashoutResponse(
            id=c.id,
            user_id=c.user_id,
            amount=float(c.amount),
            status=c.status.value,
            bank_account_holder_name=c.bank_account_holder_name,
            bank_account_last4=c.bank_account_last4,
            failure_reason=c.failure_reason,
            created_at=c.created_at,
            completed_at=c.completed_at
        )
        for c in cashouts
    ]


@router.get("/cashouts/{cashout_id}", response_model=CashoutResponse)
async def get_cashout(
    cashout_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific cashout."""
    cashout = db.query(Cashout).filter(
        Cashout.id == cashout_id,
        Cashout.user_id == current_user.id
    ).first()
    
    if not cashout:
        raise HTTPException(status_code=404, detail="Cashout not found")
    
    return CashoutResponse(
        id=cashout.id,
        user_id=cashout.user_id,
        amount=float(cashout.amount),
        status=cashout.status.value,
        bank_account_holder_name=cashout.bank_account_holder_name,
        bank_account_last4=cashout.bank_account_last4,
        failure_reason=cashout.failure_reason,
        created_at=cashout.created_at,
        completed_at=cashout.completed_at
    )


# ==================== Webhook Endpoints ====================

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        # Payment already handled in confirm_payment endpoint
        pass
    elif event.type == "payment_intent.payment_failed":
        payment_intent = event.data.object
        # Update payment record if exists
        payment = db.query(Payment).filter(
            Payment.stripe_payment_intent_id == payment_intent.id
        ).first()
        if payment:
            payment.status = "failed"
            payment.failure_reason = payment_intent.last_payment_error.message if payment_intent.last_payment_error else "Payment failed"
            db.commit()
    
    return {"status": "success"}

