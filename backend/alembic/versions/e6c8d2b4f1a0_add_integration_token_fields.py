"""add integration token fields

Revision ID: e6c8d2b4f1a0
Revises: f598c0d4d7c9
Create Date: 2026-07-30 06:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e6c8d2b4f1a0"
down_revision: Union[str, None] = "f598c0d4d7c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("integrations", sa.Column("auth_token", sa.Text(), nullable=True))
    op.add_column("integrations", sa.Column("csrf_token", sa.Text(), nullable=True))
    op.add_column("integrations", sa.Column("mx_csrf_token", sa.Text(), nullable=True))
    op.add_column("integrations", sa.Column("cookies", sa.Text(), nullable=True))
    op.add_column("integrations", sa.Column("restaurant_ids", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("integrations", "restaurant_ids")
    op.drop_column("integrations", "cookies")
    op.drop_column("integrations", "mx_csrf_token")
    op.drop_column("integrations", "csrf_token")
    op.drop_column("integrations", "auth_token")
