from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import logging
from .config import settings
from ..db.session import get_db
from ..db.models import User

logger = logging.getLogger(__name__)

security = HTTPBearer()

# Password hashing context - using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT token.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from the JWT token.
    """
    # Log request details for debugging
    auth_header = request.headers.get("Authorization", "")
    logger.info(f"[AUTH] Request to {request.url.path}")
    logger.info(f"[AUTH] Authorization header present: {bool(auth_header)}")
    if auth_header:
        logger.info(f"[AUTH] Header value (first 30 chars): {auth_header[:30]}...")
    
    token = credentials.credentials
    logger.info(f"[AUTH] Token received (first 30 chars): {token[:30] if token else 'None'}...")
    
    try:
        payload = decode_token(token)
        logger.info(f"[AUTH] Token decoded successfully, user_id: {payload.get('sub')}")
    except HTTPException as e:
        logger.error(f"[AUTH] Token decode failed: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"[AUTH] Unexpected error decoding token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        logger.error("[AUTH] No 'sub' claim in token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials - invalid token structure",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.error(f"[AUTH] User not found in database: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        logger.warning(f"[AUTH] Inactive user attempted access: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    
    logger.info(f"[AUTH] Authentication successful for user: {user.id} ({user.email})")
    return user

def get_password_hash(password: str) -> str:
    """
    Generate password hash using bcrypt.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    """
    return pwd_context.verify(plain_password, hashed_password)

def calculate_price_limit(linkedin_verified: bool) -> float:
    """
    Calculate the price limit based on verification status.
    """
    if linkedin_verified:
        return settings.LINKEDIN_VERIFIED_PRICE_LIMIT
    else:
        return settings.BASE_PRICE_LIMIT

