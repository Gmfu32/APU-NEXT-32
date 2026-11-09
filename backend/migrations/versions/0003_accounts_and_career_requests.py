"""Add persistent accounts and Career Guide request records."""
from alembic import op
import sqlalchemy as sa

revision = "0003_accounts_and_career_requests"
down_revision = "0002_remove_fictional_seed_records"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "accounts",
        sa.Column("id", sa.String(length=80), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("password_salt", sa.String(length=64), nullable=False),
        sa.Column("password_hash", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_accounts_email", "accounts", ["email"], unique=True)
    op.create_table(
        "career_requests",
        sa.Column("id", sa.String(length=80), primary_key=True),
        sa.Column("student_id", sa.String(length=80), nullable=False),
        sa.Column("request_type", sa.String(length=30), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("uploaded_file_name", sa.String(length=255)),
        sa.Column("uploaded_file_path", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_career_requests_student_id", "career_requests", ["student_id"])
    op.create_index("ix_career_requests_request_type", "career_requests", ["request_type"])


def downgrade():
    op.drop_index("ix_career_requests_request_type", table_name="career_requests")
    op.drop_index("ix_career_requests_student_id", table_name="career_requests")
    op.drop_table("career_requests")
    op.drop_index("ix_accounts_email", table_name="accounts")
    op.drop_table("accounts")
