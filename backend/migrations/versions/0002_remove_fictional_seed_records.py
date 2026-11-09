"""Remove the original fictional sample jobs and student personas."""
from alembic import op
import sqlalchemy as sa

revision = "0002_remove_fictional_seed_records"
down_revision = "0001_demo_core"
branch_labels = None
depends_on = None

SAMPLE_OPPORTUNITY_IDS = tuple(f"opp-{number:02d}" for number in range(1, 16))
SAMPLE_STUDENT_IDS = ("DEMO-SE-01", "DEMO-AI-02", "DEMO-CY-03", "DEMO-BA-04")


def upgrade():
    connection = op.get_bind()
    connection.execute(
        sa.text("DELETE FROM matches WHERE opportunity_id IN :ids OR student_id IN :student_ids")
        .bindparams(sa.bindparam("ids", expanding=True), sa.bindparam("student_ids", expanding=True)),
        {"ids": SAMPLE_OPPORTUNITY_IDS, "student_ids": SAMPLE_STUDENT_IDS},
    )
    connection.execute(
        sa.text("DELETE FROM approval_history WHERE opportunity_id IN :ids")
        .bindparams(sa.bindparam("ids", expanding=True)),
        {"ids": SAMPLE_OPPORTUNITY_IDS},
    )
    connection.execute(
        sa.text("DELETE FROM opportunities WHERE id IN :ids")
        .bindparams(sa.bindparam("ids", expanding=True)),
        {"ids": SAMPLE_OPPORTUNITY_IDS},
    )
    connection.execute(
        sa.text("DELETE FROM students WHERE id IN :ids")
        .bindparams(sa.bindparam("ids", expanding=True)),
        {"ids": SAMPLE_STUDENT_IDS},
    )


def downgrade():
    # Fictional sample content is intentionally not restored.
    pass
