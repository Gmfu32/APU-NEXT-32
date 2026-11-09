"""Persistent profile, opportunity, approval and match records."""
from alembic import op
import sqlalchemy as sa
revision = "0001_demo_core"
down_revision = None
branch_labels = None
depends_on = None
def upgrade():
    op.create_table("students", sa.Column("id", sa.String(80), primary_key=True), sa.Column("data", sa.JSON(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_table("opportunities", sa.Column("id", sa.String(100), primary_key=True), sa.Column("status", sa.String(30), nullable=False), sa.Column("data", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_table("matches", sa.Column("id", sa.String(200), primary_key=True), sa.Column("student_id", sa.String(80), nullable=False), sa.Column("opportunity_id", sa.String(100), nullable=False), sa.Column("score", sa.Integer(), nullable=False), sa.Column("components", sa.JSON(), nullable=False), sa.Column("reasons", sa.JSON(), nullable=False), sa.Column("response", sa.String(30)), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_index("ix_matches_student_id", "matches", ["student_id"])
    op.create_index("ix_matches_opportunity_id", "matches", ["opportunity_id"])
    op.create_table("approval_history", sa.Column("id", sa.String(200), primary_key=True), sa.Column("opportunity_id", sa.String(100), nullable=False), sa.Column("action", sa.String(30), nullable=False), sa.Column("actor", sa.String(100), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_approval_history_opportunity_id", "approval_history", ["opportunity_id"])
def downgrade():
    op.drop_index("ix_approval_history_opportunity_id", table_name="approval_history")
    op.drop_table("approval_history")
    op.drop_index("ix_matches_opportunity_id", table_name="matches")
    op.drop_index("ix_matches_student_id", table_name="matches")
    op.drop_table("matches")
    op.drop_table("opportunities")
    op.drop_table("students")
