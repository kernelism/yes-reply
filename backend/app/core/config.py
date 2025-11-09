from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "YesReply"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./yesreply.db"
    
    # JWT Settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # AWS SES config
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_SES_FROM_DOMAIN: str = "yesreply.tech"
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: Optional[str] = "sk_test_51SRLOFCSsnKFcIrSMK69e8Ut9DqMDgJ69DUHgMWUdX1VhCKDa5FMjPVcN1qCTpcUaO032gztVmbXs7nOYYaR5lwK00iI3rCP4b"
    STRIPE_PUBLISHABLE_KEY: Optional[str] = "pk_test_51SRLOFCSsnKFcIrScx4i5ujCvLop8ujF4xDjZJqCswaSt9tHyB3z1bl1OiYrlfMMYAOcmEtcD5czbHmpWNbf4ICY00kE9GADvj"
    STRIPE_WEBHOOK_SECRET: Optional[str] = "whsec_ZnOkWbzcDeuaAfuR9tKF2BghkwoNg8O1"
    
    # Payment Configuration
    MIN_CASHOUT_AMOUNT: float = 10.00  # Minimum $10 to cash out
    EMAIL_RECEIVE_PAYMENT: float = 0.20  # $0.20 on email receive
    
    # Price Limits
    BASE_PRICE_LIMIT: float = 2.0  # $2 for unverified users
    LINKEDIN_VERIFIED_PRICE_LIMIT: float = 5.0  # $5 for LinkedIn verified users
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        # Try multiple paths for .env file
        extra="ignore"
    )


settings = Settings()

# Debug: Log Stripe configuration status (without exposing keys)
import logging
import os
logger = logging.getLogger(__name__)

env_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
logger.info(f"[CONFIG] Looking for .env file at: {env_file_path}")
logger.info(f"[CONFIG] .env file exists: {os.path.exists(env_file_path)}")
stripe_secret_from_env = os.getenv("STRIPE_SECRET_KEY")
stripe_pub_from_env = os.getenv("STRIPE_PUBLISHABLE_KEY")
logger.info(f"[CONFIG] STRIPE_SECRET_KEY from os.getenv: {'SET' if stripe_secret_from_env else 'NOT SET'}")
logger.info(f"[CONFIG] STRIPE_PUBLISHABLE_KEY from os.getenv: {'SET' if stripe_pub_from_env else 'NOT SET'}")

if settings.STRIPE_SECRET_KEY:
    logger.info(f"[CONFIG] Stripe secret key configured: {settings.STRIPE_SECRET_KEY[:10]}...")
else:
    logger.warning("[CONFIG] Stripe secret key NOT configured in settings")
if settings.STRIPE_PUBLISHABLE_KEY:
    logger.info(f"[CONFIG] Stripe publishable key configured: {settings.STRIPE_PUBLISHABLE_KEY[:10]}...")
else:
    logger.warning("[CONFIG] Stripe publishable key NOT configured in settings")

