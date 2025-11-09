"""add_email_table

Revision ID: fd6e2b98ae43
Revises: f994b87b6275
Create Date: 2025-11-08 05:32:01.927917

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd6e2b98ae43'
down_revision: Union[str, Sequence[str], None] = 'f994b87b6275'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # For SQLite, we need to recreate the table with the new schema
    # Drop old table and create new one
    op.drop_table('emails')
    
    # Create new emails table with updated schema
    op.create_table(
        'emails',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('sent_by', sa.String(), nullable=False),
        sa.Column('received_by', sa.String(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('html_body', sa.Text(), nullable=True),
        sa.Column('original_email_id', sa.String(), nullable=True),
        sa.Column('thread_number', sa.Integer(), nullable=True),
        sa.Column('thread_root_id', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED', name='emailstatus'), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('priority', sa.String(), nullable=True),
        sa.Column('external_message_id', sa.String(), nullable=True),
        sa.Column('external_thread_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['original_email_id'], ['emails.id'], ),
        sa.ForeignKeyConstraint(['received_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sent_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_emails_external_message_id'), 'emails', ['external_message_id'], unique=False)
    op.create_index(op.f('ix_emails_external_thread_id'), 'emails', ['external_thread_id'], unique=False)
    op.create_index(op.f('ix_emails_id'), 'emails', ['id'], unique=False)
    op.create_index(op.f('ix_emails_original_email_id'), 'emails', ['original_email_id'], unique=False)
    op.create_index(op.f('ix_emails_received_by'), 'emails', ['received_by'], unique=False)
    op.create_index(op.f('ix_emails_sent_by'), 'emails', ['sent_by'], unique=False)
    op.create_index(op.f('ix_emails_thread_root_id'), 'emails', ['thread_root_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop new table and recreate old one
    op.drop_table('emails')
    
    # Recreate old emails table (if you had data, you'd want to back it up first)
    op.create_table(
        'emails',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('sent_by', sa.String(), nullable=False),
        sa.Column('received_by', sa.String(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('thread_id', sa.VARCHAR(), nullable=False),
        sa.Column('parent_email_id', sa.VARCHAR(), nullable=True),
        sa.Column('thread_number', sa.INTEGER(), nullable=False),
        sa.Column('is_read', sa.BOOLEAN(), nullable=True),
        sa.Column('is_starred', sa.BOOLEAN(), nullable=True),
        sa.Column('is_archived', sa.BOOLEAN(), nullable=True),
        sa.Column('created_at', sa.DATETIME(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DATETIME(), nullable=True),
        sa.ForeignKeyConstraint(['parent_email_id'], ['emails.id'], ),
        sa.ForeignKeyConstraint(['received_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sent_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_emails_created_at', 'emails', ['created_at'], unique=False)
    op.create_index('ix_emails_parent_email_id', 'emails', ['parent_email_id'], unique=False)
    op.create_index('ix_emails_thread_id', 'emails', ['thread_id'], unique=False)
