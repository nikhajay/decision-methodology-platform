"""create users table

Revision ID: a1f06182a38f
Revises: 
Create Date: 2026-09-04 18:15:43.771843

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f06182a38f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role = sa.Enum(
        "architect", 
        "ba", 
        "pm", 
        "teamlead", 
        "testlead", 
        "srengineer",  
        "engineer", 
        name="user_role"
    )

    

    op.create_table(
        "users",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False
        ),

        sa.Column(
            "name",
            sa.String(100),
            nullable=False
        ),

        sa.Column(
            "email",
            sa.String(150),
            nullable=False,
            unique=True
        ),

        sa.Column(
            "phone",
            sa.String(20),
            nullable=True
        ),

        sa.Column(
            "password",
            sa.String(255),
            nullable=False
        ),

        sa.Column(
            "role",
            user_role,
            nullable=False,
            server_default="engineer"
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true")
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()")
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()")
        ),
    )

    op.create_index(
        "ix_users_id",
        "users",
        ["id"]
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True
    )
    


def downgrade() -> None:
    op.drop_index(
        "ix_users_email",
        table_name="users"
    )

    op.drop_index(
        "ix_users_id",
        table_name="users"
    )

    op.drop_table("users")

    # Drop PostgreSQL ENUM
    sa.Enum(
        "architect", 
        "ba", 
        "pm", 
        "teamlead", 
        "testlead", 
        "srengineer",  
        "engineer", 
        name="user_role"
    ).drop(op.get_bind(), checkfirst=True)
