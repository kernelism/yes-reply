from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import uuid
import json
import re
from datetime import datetime
from typing import List

from ..db.session import get_db
from ..db.models import User
from ..core.config import settings
from ..core.security import create_access_token, get_current_user
from .schemas import (
    UserLogin,
    UserCreate,
    UserUpdate,
    UserResponse,
    TokenResponse,
)


router = APIRouter(prefix="/users", tags=["users"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    print("Password received for hashing:", repr(password))
    return pwd_context.hash(password)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate username from email if not provided (extract part before @)
    # Email is only for authentication, username is for @yesreply.tech address
    if user_data.username:
        # Use provided username, but ensure it's unique
        username = user_data.username.lower()
        counter = 1
        original_username = username
        while db.query(User).filter(User.username == username).first():
            username = f"{original_username}{counter}"
            counter += 1
    else:
        # Generate username from email
        email_local = user_data.email.split('@')[0].lower()
        # Clean username: remove special chars, keep alphanumeric and hyphens/underscores
        username_base = re.sub(r'[^a-z0-9_-]', '', email_local)
        
        # Ensure username is unique
        username = username_base
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{username_base}{counter}"
            counter += 1
    
    # Create new user with only required fields
    user = User(
        id=str(uuid.uuid4()),
        email=user_data.email,  # Email is only for authentication
        username=username,  # Username is for @yesreply.tech email address
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        description=user_data.description,
        password_hash=get_password_hash(user_data.password),
        # Default values
        price_limit=settings.BASE_PRICE_LIMIT,
        linkedin_verified=False,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    """
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    """
    return UserResponse.model_validate(current_user)


@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all users (paginated).
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(user) for user in users]


@router.get("/by-username/{username}", response_model=UserResponse)
async def get_user_by_username(
    username: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific user by username (public route for viewing profiles).
    """
    user = db.query(User).filter(User.username == username.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update basic fields if provided
    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.last_name is not None:
        user.last_name = user_data.last_name
    if user_data.description is not None:
        user.description = user_data.description
    if user_data.password is not None:
        user.password_hash = get_password_hash(user_data.password)
    
    # Update professional fields if provided
    if user_data.job_title is not None:
        user.job_title = user_data.job_title
    if user_data.company is not None:
        user.company = user_data.company
    if user_data.location is not None:
        user.location = user_data.location
    if user_data.industry is not None:
        user.industry = user_data.industry
    if user_data.bio is not None:
        user.bio = user_data.bio
    if user_data.expertise is not None:
        user.expertise = user_data.expertise
    if user_data.looking_for is not None:
        user.looking_for = json.dumps(user_data.looking_for)
    
    # Update social links if provided
    if user_data.linkedin_url is not None:
        user.linkedin_profile_url = user_data.linkedin_url
    if user_data.twitter_url is not None:
        user.twitter_url = user_data.twitter_url
    if user_data.website_url is not None:
        user.website_url = user_data.website_url
    if user_data.calendly_url is not None:
        user.calendly_url = user_data.calendly_url
    
    # Update price_limit if provided (with validation based on verification status)
    if user_data.price_limit is not None:
        from ..core.security import calculate_price_limit
        max_allowed = calculate_price_limit(linkedin_verified=user.linkedin_verified)
        if user_data.price_limit > max_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Price limit cannot exceed ${max_allowed} based on your verification status"
            )
        user.price_limit = user_data.price_limit
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return None

