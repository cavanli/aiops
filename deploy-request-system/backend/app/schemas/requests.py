from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.models.models import RequestStatus, EnvType
from app.schemas.auth import UserOut

class RequestCreate(BaseModel):
    project_name: str
    product_version: str
    env_type: EnvType
    env_description: str
    expected_date: Optional[date] = None
    remarks: Optional[str] = None

class RequestUpdate(BaseModel):
    project_name: Optional[str] = None
    product_version: Optional[str] = None
    env_type: Optional[EnvType] = None
    env_description: Optional[str] = None
    expected_date: Optional[date] = None
    remarks: Optional[str] = None

class ApproveIn(BaseModel):
    action: str  # "approved" | "rejected"
    comment: Optional[str] = None

class ResourceIn(BaseModel):
    db_config: str
    middleware_versions: str
    network_policy: str

class FeedbackIn(BaseModel):
    deploy_start: date
    deploy_end: date
    summary: str

class ApprovalOut(BaseModel):
    action: str
    comment: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

class ResourceOut(BaseModel):
    db_config: str
    middleware_versions: str
    network_policy: str
    created_at: datetime
    model_config = {"from_attributes": True}

class FeedbackOut(BaseModel):
    deploy_start: date
    deploy_end: date
    summary: str
    created_at: datetime
    model_config = {"from_attributes": True}

class RequestOut(BaseModel):
    id: int
    req_no: str
    project_name: str
    product_version: str
    env_type: EnvType
    env_description: str
    expected_date: Optional[date]
    remarks: Optional[str]
    status: RequestStatus
    applicant: UserOut
    approval: Optional[ApprovalOut]
    resource_config: Optional[ResourceOut]
    feedback: Optional[FeedbackOut]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class RequestListOut(BaseModel):
    items: list[RequestOut]
    total: int
