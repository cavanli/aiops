from datetime import date
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import DeployRequest, RequestStatus, User
from app.schemas.requests import (
    RequestCreate, RequestUpdate, RequestOut, RequestListOut,
    ApproveIn, ResourceIn, FeedbackIn
)
from app.services import notification

router = APIRouter()

def _generate_req_no(db: Session) -> str:
    count = db.query(DeployRequest).count() + 1
    today = date.today()
    return f"REQ-{today.year}-{today.strftime('%m%d')}-{count:03d}"

@router.post("", response_model=RequestOut, status_code=201)
async def create_request(
    data: RequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = DeployRequest(
        req_no=_generate_req_no(db),
        applicant_id=current_user.id,
        **data.model_dump(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    background_tasks.add_task(notification.notify_new_request, req, db)
    return req

@router.get("", response_model=RequestListOut)
def list_requests(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DeployRequest)
    if current_user.role == "tech_support":
        q = q.filter(DeployRequest.applicant_id == current_user.id)
    elif current_user.role == "tester":
        q = q.filter(DeployRequest.status.in_(["approved", "ready", "completed"]))
    if status:
        q = q.filter(DeployRequest.status == status)
    total = q.count()
    items = q.order_by(DeployRequest.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return RequestListOut(items=items, total=total)

@router.get("/{req_id}", response_model=RequestOut)
def get_request(req_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.get(DeployRequest, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user.role == "tech_support" and req.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return req

@router.put("/{req_id}", response_model=RequestOut)
def update_request(
    req_id: int, data: RequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = db.get(DeployRequest, req_id)
    if not req or req.applicant_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status != RequestStatus.pending:
        raise HTTPException(status_code=422, detail="Can only edit pending requests")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(req, k, v)
    db.commit()
    db.refresh(req)
    return req

@router.post("/{req_id}/cancel", response_model=RequestOut)
def cancel_request(
    req_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = db.get(DeployRequest, req_id)
    if not req or req.applicant_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status != RequestStatus.pending:
        raise HTTPException(status_code=422, detail="Can only cancel pending requests")
    req.status = RequestStatus.cancelled
    db.commit()
    db.refresh(req)
    return req

from app.services import workflow

@router.post("/{req_id}/approve", response_model=RequestOut)
async def approve_request(
    req_id: int, data: ApproveIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pm")),
):
    req = db.get(DeployRequest, req_id)
    if not req:
        raise HTTPException(status_code=404)
    updated = workflow.approve(req, data, current_user.id, db)
    if data.action == "approved":
        background_tasks.add_task(notification.notify_approved, updated, db)
    else:
        background_tasks.add_task(notification.notify_rejected, updated, db)
    return updated

@router.post("/{req_id}/resource", response_model=RequestOut)
async def submit_resource(
    req_id: int, data: ResourceIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tester")),
):
    req = db.get(DeployRequest, req_id)
    if not req:
        raise HTTPException(status_code=404)
    updated = workflow.submit_resource(req, data, current_user.id, db)
    background_tasks.add_task(notification.notify_resource_ready, updated, db)
    return updated

@router.post("/{req_id}/feedback", response_model=RequestOut)
async def submit_feedback(
    req_id: int, data: FeedbackIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = db.get(DeployRequest, req_id)
    if not req or req.applicant_id != current_user.id:
        raise HTTPException(status_code=404)
    updated = workflow.submit_feedback(req, data, current_user.id, db)
    background_tasks.add_task(notification.notify_completed, updated, db)
    return updated
