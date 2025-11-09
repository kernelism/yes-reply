"""add_payment_tracking_fields

Revision ID: 1a2b3c4d5e6f
Revises: 462887b2bb92
Create Date: 2025-11-09 02:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import Numeric


# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = '462887b2bb92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add payment tracking fields to emails table
    op.add_column('emails', sa.Column('initial_payment_sent', sa.Boolean(), nullable=True, server_default='0'))
    op.add_column('emails', sa.Column('full_payment_sent', sa.Boolean(), nullable=True, server_default='0'))
    op.add_column('emails', sa.Column('initial_payment_amount', sa.Numeric(10, 2), nullable=True, server_default='0.05'))
    op.add_column('emails', sa.Column('remaining_payment_amount', sa.Numeric(10, 2), nullable=True, server_default='0.00'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove payment tracking fields from emails table
    op.drop_column('emails', 'remaining_payment_amount')
    op.drop_column('emails', 'initial_payment_amount')
    op.drop_column('emails', 'full_payment_sent')
    op.drop_column('emails', 'initial_payment_sent')

