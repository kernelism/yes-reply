"""add_notifications_and_refund_fields

Revision ID: 9d8e7f6a5b4c
Revises: 1ac97efbf7e0
Create Date: 2025-11-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d8e7f6a5b4c'
down_revision: Union[str, Sequence[str], None] = '1ac97efbf7e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add refund tracking fields to emails table
    op.add_column('emails', sa.Column('refund_processed', sa.Boolean(), nullable=True, server_default='0'))
    op.add_column('emails', sa.Column('refund_amount', sa.Numeric(10, 2), nullable=True, server_default='0.00'))
    op.add_column('emails', sa.Column('refund_processed_at', sa.DateTime(timezone=True), nullable=True))
    
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('PAYMENT_RECEIVED', 'PAYMENT_RESPONSE_AVAILABLE', 'REFUND_PROCESSED', name='notificationtype'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=True),
        sa.Column('potential_amount', sa.Numeric(10, 2), nullable=True),
        sa.Column('email_id', sa.String(), nullable=True),
        sa.Column('transaction_id', sa.String(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['email_id'], ['emails.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], )
    )
    
    # Create indexes
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_email_id'), 'notifications', ['email_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index(op.f('ix_notifications_email_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    
    # Drop notifications table
    op.drop_table('notifications')
    
    # Remove refund fields from emails table
    op.drop_column('emails', 'refund_processed_at')
    op.drop_column('emails', 'refund_amount')
    op.drop_column('emails', 'refund_processed')
    
    # Drop enum type (for PostgreSQL, not needed for SQLite)
    # op.execute('DROP TYPE IF EXISTS notificationtype')

