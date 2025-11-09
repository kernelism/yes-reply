"""merge_all_heads

Revision ID: 462887b2bb92
Revises: 8a9b1c2d3e4f, 9d8e7f6a5b4c, f447748e63cf
Create Date: 2025-11-09 02:24:51.582045

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '462887b2bb92'
down_revision: Union[str, Sequence[str], None] = ('8a9b1c2d3e4f', '9d8e7f6a5b4c', 'f447748e63cf')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
