"""add attachments field

Revision ID: a1b2c3d4e5f6
Revises: 7625a93b31b9
Create Date: 2025-11-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '7625a93b31b9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add attachments column to emails table
    op.add_column('emails', sa.Column('attachments', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove attachments column from emails table
    op.drop_column('emails', 'attachments')

