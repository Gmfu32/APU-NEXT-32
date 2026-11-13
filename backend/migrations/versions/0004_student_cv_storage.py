"""Store uploaded student CVs privately."""
from alembic import op
import sqlalchemy as sa

revision = "0004_student_cv_storage"
down_revision = "0003_accounts_and_career_requests"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("students", sa.Column("cv_file_name", sa.String(length=255), nullable=True))
    op.add_column("students", sa.Column("cv_file_path", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("students", "cv_file_path")
    op.drop_column("students", "cv_file_name")
