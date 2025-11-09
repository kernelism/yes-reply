"""remove_payment_fields

Revision ID: 1ac97efbf7e0
Revises: c4921b652f50
Create Date: 2025-11-08 14:44:02.254071

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ac97efbf7e0'
down_revision: Union[str, Sequence[str], None] = 'c4921b652f50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove fields that were added in c4921b652f50 but are no longer in the model
    # These fields are not in the current Email model, so they should be removed
    # Drop indexes first, then columns
    op.drop_index(op.f('ix_emails_message_id'), table_name='emails')
    op.drop_index(op.f('ix_emails_in_reply_to'), table_name='emails')
    op.drop_column('emails', 'payment_required')
    op.drop_column('emails', 'payment_completed')
    op.drop_column('emails', 'payment_id')
    op.drop_column('emails', 'message_id')
    op.drop_column('emails', 'in_reply_to')
    op.drop_column('emails', 'references')
    
    # Remove username field from users (it's not in the current model)
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'username')


def downgrade() -> None:
    """Downgrade schema."""
    # Re-add the fields (reverse of upgrade)
    op.add_column('emails', sa.Column('payment_required', sa.Boolean(), nullable=True))
    op.add_column('emails', sa.Column('payment_completed', sa.Boolean(), nullable=True))
    op.add_column('emails', sa.Column('payment_id', sa.String(), nullable=True))
    op.add_column('emails', sa.Column('message_id', sa.String(), nullable=True))
    op.add_column('emails', sa.Column('in_reply_to', sa.String(), nullable=True))
    op.add_column('emails', sa.Column('references', sa.Text(), nullable=True))
    op.create_index(op.f('ix_emails_message_id'), 'emails', ['message_id'], unique=True)
    op.create_index(op.f('ix_emails_in_reply_to'), 'emails', ['in_reply_to'], unique=False)
    
    op.add_column('users', sa.Column('username', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
