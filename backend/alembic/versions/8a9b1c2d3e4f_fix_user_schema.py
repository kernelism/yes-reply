"""fix_user_schema

Revision ID: 8a9b1c2d3e4f
Revises: 7625a93b31b9
Create Date: 2025-11-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a9b1c2d3e4f'
down_revision: Union[str, Sequence[str], None] = '7625a93b31b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Re-add username field that was incorrectly removed in 1ac97efbf7e0
    # Check if column exists first (in case migration is run on fresh DB)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'username' not in columns:
        # Add username field as nullable first
        op.add_column('users', sa.Column('username', sa.String(), nullable=True))
        
        # Generate usernames for existing users based on their email (before @)
        op.execute("""
            UPDATE users 
            SET username = LOWER(SUBSTR(email, 1, INSTR(email, '@') - 1))
            WHERE username IS NULL
        """)
        
        # Create unique index on username
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Re-add email threading fields that were incorrectly removed
    if 'message_id' not in columns:
        op.add_column('emails', sa.Column('message_id', sa.String(), nullable=True))
        op.create_index(op.f('ix_emails_message_id'), 'emails', ['message_id'], unique=True)
    
    email_columns = [col['name'] for col in inspector.get_columns('emails')]
    if 'in_reply_to' not in email_columns:
        op.add_column('emails', sa.Column('in_reply_to', sa.String(), nullable=True))
        op.create_index(op.f('ix_emails_in_reply_to'), 'emails', ['in_reply_to'], unique=False)
    
    if 'references' not in email_columns:
        op.add_column('emails', sa.Column('references', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # This migration fixes issues, so downgrade just maintains current state
    pass

