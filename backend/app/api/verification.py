from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timedelta
import httpx

from ..db.session import get_db
from ..db.models import User, LinkedInVerification, VerificationStatus
from ..core.config import settings
from ..core.security import get_current_user, calculate_price_limit
from .schemas import (
    LinkedInAuthURLResponse,
    LinkedInCallbackRequest,
    LinkedInVerificationResponse,
)


router = APIRouter(prefix="/verification", tags=["verification"])


# ==================== LinkedIn Verification ====================

@router.get("/linkedin/authorize", response_model=LinkedInAuthURLResponse)
async def get_linkedin_auth_url(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get LinkedIn OAuth authorization URL.
    User should be redirected to this URL to authorize the application.
    """
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="LinkedIn verification is not configured"
        )
    
    # Generate state for CSRF protection
    state = str(uuid.uuid4())
    
    # Create verification record
    verification = LinkedInVerification(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        linkedin_state=state,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    db.add(verification)
    db.commit()
    
    # Build LinkedIn authorization URL
    base_url = "https://www.linkedin.com/oauth/v2/authorization"
    params = {
        "response_type": "code",
        "client_id": settings.LINKEDIN_CLIENT_ID,
        "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
        "state": state,
        "scope": "openid profile email"
    }
    
    auth_url = f"{base_url}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    
    return LinkedInAuthURLResponse(
        authorization_url=auth_url,
        state=state
    )


@router.post("/linkedin/callback", response_model=LinkedInVerificationResponse)
async def linkedin_callback(
    callback_request: LinkedInCallbackRequest,
    db: Session = Depends(get_db)
):
    """
    Handle LinkedIn OAuth callback.
    Exchanges the authorization code for access token and verifies the user.
    """
    if not settings.LINKEDIN_CLIENT_ID or not settings.LINKEDIN_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="LinkedIn verification is not configured"
        )
    
    # Find verification record
    verification = db.query(LinkedInVerification).filter(
        LinkedInVerification.linkedin_state == callback_request.state,
        LinkedInVerification.is_verified == False
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired verification state"
        )
    
    # Check if state is expired
    if datetime.utcnow() > verification.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification session has expired. Please try again."
        )
    
    # Get user
    user = db.query(User).filter(User.id == verification.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        # Exchange code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": callback_request.code,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                    "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange LinkedIn authorization code"
                )
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            # Get user profile
            profile_response = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if profile_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to fetch LinkedIn profile"
                )
            
            profile_data = profile_response.json()
            linkedin_id = profile_data.get("sub")
            
            # Check if LinkedIn is already verified by another user
            existing_user = db.query(User).filter(
                User.linkedin_id == linkedin_id,
                User.linkedin_verified == True,
                User.id != user.id
            ).first()
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This LinkedIn account is already verified by another user"
                )
            
            # Update verification record
            verification.is_verified = True
            verification.linkedin_code = callback_request.code
            
            # Update user
            user.linkedin_id = linkedin_id
            user.linkedin_verified = True
            user.linkedin_verification_status = VerificationStatus.VERIFIED
            
            # Build profile URL if available
            if linkedin_id:
                user.linkedin_profile_url = f"https://www.linkedin.com/in/{linkedin_id}"
            
            # Calculate and update price limit
            new_price_limit = calculate_price_limit(
                linkedin_verified=True
            )
            user.price_limit = new_price_limit
            
            db.commit()
            db.refresh(user)
            
            return LinkedInVerificationResponse(
                message="LinkedIn account verified successfully",
                linkedin_verified=True,
                linkedin_profile_url=user.linkedin_profile_url,
                new_price_limit=new_price_limit
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LinkedIn verification failed: {str(e)}"
        )


@router.post("/linkedin/dummy-verify", response_model=LinkedInVerificationResponse)
async def dummy_linkedin_verify(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dummy LinkedIn verification endpoint that auto-verifies the user.
    For development/testing purposes.
    """
    # Check if already verified
    if current_user.linkedin_verified:
        return LinkedInVerificationResponse(
            message="LinkedIn account already verified",
            linkedin_verified=True,
            linkedin_profile_url=current_user.linkedin_profile_url,
            new_price_limit=current_user.price_limit
        )
    
    # Auto-verify the user
    current_user.linkedin_id = f"dummy_{current_user.id}"
    current_user.linkedin_verified = True
    current_user.linkedin_verification_status = VerificationStatus.VERIFIED
    
    # Set a dummy profile URL
    if not current_user.linkedin_profile_url:
        current_user.linkedin_profile_url = f"https://www.linkedin.com/in/dummy-{current_user.id}"
    
    # Calculate and update price limit
    new_price_limit = calculate_price_limit(linkedin_verified=True)
    current_user.price_limit = new_price_limit
    
    db.commit()
    db.refresh(current_user)
    
    return LinkedInVerificationResponse(
        message="LinkedIn account verified successfully (dummy verification)",
        linkedin_verified=True,
        linkedin_profile_url=current_user.linkedin_profile_url,
        new_price_limit=new_price_limit
    )

