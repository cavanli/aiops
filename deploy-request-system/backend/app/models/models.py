import enum
from datetime import datetime, date
from sqlalchemy import String, Text, Enum, ForeignKey, Date, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    tech_support = "tech_support"
    pm = "pm"
    tester = "tester"

class NotificationPlatform(str, enum.Enum):
    wechat = "wechat"
    dingtalk = "dingtalk"

class RequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    ready = "ready"
    completed = "completed"
    cancelled = "cancelled"

class EnvType(str, enum.Enum):
    dev = "dev"
    test = "test"
    staging = "staging"
    prod = "prod"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    name: Mapped[str] = mapped_column(String(64))
    notification_platform: Mapped[NotificationPlatform] = mapped_column(Enum(NotificationPlatform))
    notification_handle: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class DeployRequest(Base):
    __tablename__ = "deploy_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    req_no: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    project_name: Mapped[str] = mapped_column(String(128))
    product_version: Mapped[str] = mapped_column(String(64))
    env_type: Mapped[EnvType] = mapped_column(Enum(EnvType))
    env_description: Mapped[str] = mapped_column(Text)
    expected_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[RequestStatus] = mapped_column(Enum(RequestStatus), default=RequestStatus.pending)
    applicant_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    applicant: Mapped["User"] = relationship("User", foreign_keys=[applicant_id])
    approval: Mapped["Approval | None"] = relationship("Approval", back_populates="request", uselist=False)
    resource_config: Mapped["ResourceConfig | None"] = relationship("ResourceConfig", back_populates="request", uselist=False)
    feedback: Mapped["DeployFeedback | None"] = relationship("DeployFeedback", back_populates="request", uselist=False)

class Approval(Base):
    __tablename__ = "approvals"
    __table_args__ = (UniqueConstraint("request_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("deploy_requests.id"))
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(16))
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    request: Mapped["DeployRequest"] = relationship("DeployRequest", back_populates="approval")

class ResourceConfig(Base):
    __tablename__ = "resource_configs"
    __table_args__ = (UniqueConstraint("request_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("deploy_requests.id"))
    db_config: Mapped[str] = mapped_column(Text)
    middleware_versions: Mapped[str] = mapped_column(Text)
    network_policy: Mapped[str] = mapped_column(Text)
    provider_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    request: Mapped["DeployRequest"] = relationship("DeployRequest", back_populates="resource_config")

class DeployFeedback(Base):
    __tablename__ = "deploy_feedbacks"
    __table_args__ = (UniqueConstraint("request_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("deploy_requests.id"))
    deploy_start: Mapped[date] = mapped_column(Date)
    deploy_end: Mapped[date] = mapped_column(Date)
    summary: Mapped[str] = mapped_column(Text)
    submitter_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    request: Mapped["DeployRequest"] = relationship("DeployRequest", back_populates="feedback")
