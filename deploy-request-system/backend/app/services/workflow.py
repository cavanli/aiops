from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.models import (
    DeployRequest, Approval, ResourceConfig, DeployFeedback, RequestStatus
)
from app.schemas.requests import ApproveIn, ResourceIn, FeedbackIn

VALID_TRANSITIONS = {
    RequestStatus.pending: [RequestStatus.approved, RequestStatus.rejected, RequestStatus.cancelled],
    RequestStatus.approved: [RequestStatus.ready],
    RequestStatus.ready: [RequestStatus.completed],
}

def _assert_transition(req: DeployRequest, target: RequestStatus):
    allowed = VALID_TRANSITIONS.get(req.status, [])
    if target not in allowed:
        raise HTTPException(status_code=422, detail=f"Cannot transition from {req.status} to {target}")

def approve(req: DeployRequest, data: ApproveIn, reviewer_id: int, db: Session) -> DeployRequest:
    target = RequestStatus.approved if data.action == "approved" else RequestStatus.rejected
    _assert_transition(req, target)
    approval = Approval(request_id=req.id, reviewer_id=reviewer_id,
                        action=data.action, comment=data.comment)
    req.status = target
    db.add(approval)
    db.commit()
    db.refresh(req)
    return req

def submit_resource(req: DeployRequest, data: ResourceIn, provider_id: int, db: Session) -> DeployRequest:
    _assert_transition(req, RequestStatus.ready)
    config = ResourceConfig(
        request_id=req.id, provider_id=provider_id,
        db_config=data.db_config, middleware_versions=data.middleware_versions,
        network_policy=data.network_policy,
    )
    req.status = RequestStatus.ready
    db.add(config)
    db.commit()
    db.refresh(req)
    return req

def submit_feedback(req: DeployRequest, data: FeedbackIn, submitter_id: int, db: Session) -> DeployRequest:
    _assert_transition(req, RequestStatus.completed)
    feedback = DeployFeedback(
        request_id=req.id, submitter_id=submitter_id,
        deploy_start=data.deploy_start, deploy_end=data.deploy_end, summary=data.summary,
    )
    req.status = RequestStatus.completed
    db.add(feedback)
    db.commit()
    db.refresh(req)
    return req
