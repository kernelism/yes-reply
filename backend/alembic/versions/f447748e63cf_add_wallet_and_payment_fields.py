"""add_wallet_and_payment_fields

Revision ID: f447748e63cf
Revises: a1b2c3d4e5f6
Create Date: 2025-11-08 20:21:35.080250

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f447748e63cf'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add wallet and payment fields to users table
    op.add_column('users', sa.Column('wallet_balance', sa.Numeric(10, 2), nullable=False, server_default='0.00'))
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('bank_account_holder_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('bank_account_last4', sa.String(), nullable=True))
    op.add_column('users', sa.Column('stripe_bank_account_id', sa.String(), nullable=True))
    
    # Create unique index for stripe_customer_id
    op.create_index(op.f('ix_users_stripe_customer_id'), 'users', ['stripe_customer_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index first
    op.drop_index(op.f('ix_users_stripe_customer_id'), table_name='users')
    
    # Drop columns
    op.drop_column('users', 'stripe_bank_account_id')
    op.drop_column('users', 'bank_account_last4')
    op.drop_column('users', 'bank_account_holder_name')
    op.drop_column('users', 'stripe_customer_id')
    op.drop_column('users', 'wallet_balance')
