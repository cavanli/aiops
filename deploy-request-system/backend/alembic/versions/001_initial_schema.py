"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### users table ###
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=64), nullable=False),
        sa.Column('password_hash', sa.String(length=128), nullable=False),
        sa.Column('role', sa.Enum('tech_support', 'pm', 'tester', name='userrole'), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('notification_platform', sa.Enum('wechat', 'dingtalk', name='notificationplatform'), nullable=False),
        sa.Column('notification_handle', sa.String(length=256), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # ### deploy_requests table ###
    op.create_table(
        'deploy_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('req_no', sa.String(length=32), nullable=False),
        sa.Column('project_name', sa.String(length=128), nullable=False),
        sa.Column('product_version', sa.String(length=64), nullable=False),
        sa.Column('env_type', sa.Enum('dev', 'test', 'staging', 'prod', name='envtype'), nullable=False),
        sa.Column('env_description', sa.Text(), nullable=False),
        sa.Column('expected_date', sa.Date(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', 'ready', 'completed', 'cancelled', name='requeststatus'), nullable=False),
        sa.Column('applicant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['applicant_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_deploy_requests_req_no'), 'deploy_requests', ['req_no'], unique=True)

    # ### approvals table ###
    op.create_table(
        'approvals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=16), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['deploy_requests.id'], ),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('request_id')
    )

    # ### resource_configs table ###
    op.create_table(
        'resource_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('db_config', sa.Text(), nullable=False),
        sa.Column('middleware_versions', sa.Text(), nullable=False),
        sa.Column('network_policy', sa.Text(), nullable=False),
        sa.Column('provider_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['request_id'], ['deploy_requests.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('request_id')
    )

    # ### deploy_feedbacks table ###
    op.create_table(
        'deploy_feedbacks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('deploy_start', sa.Date(), nullable=False),
        sa.Column('deploy_end', sa.Date(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('submitter_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['deploy_requests.id'], ),
        sa.ForeignKeyConstraint(['submitter_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('request_id')
    )


def downgrade() -> None:
    op.drop_table('deploy_feedbacks')
    op.drop_table('resource_configs')
    op.drop_table('approvals')
    op.drop_index(op.f('ix_deploy_requests_req_no'), table_name='deploy_requests')
    op.drop_table('deploy_requests')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')
    sa.Enum(name='envtype').drop(op.get_bind())
    sa.Enum(name='requeststatus').drop(op.get_bind())
    sa.Enum(name='notificationplatform').drop(op.get_bind())
    sa.Enum(name='userrole').drop(op.get_bind())
