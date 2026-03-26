import asyncio
import httpx
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import User, DeployRequest, UserRole, NotificationPlatform

async def _send(handle: str, platform: NotificationPlatform, text: str):
    if not handle:
        return
    try:
        if platform == NotificationPlatform.wechat and settings.WECHAT_WEBHOOK_URL:
            payload = {"msgtype": "text", "text": {"content": text, "mentioned_list": [handle]}}
            async with httpx.AsyncClient() as client:
                await client.post(settings.WECHAT_WEBHOOK_URL, json=payload, timeout=5)
        elif platform == NotificationPlatform.dingtalk and settings.DINGTALK_WEBHOOK_URL:
            payload = {"msgtype": "text", "text": {"content": text}, "at": {"atMobiles": [handle]}}
            async with httpx.AsyncClient() as client:
                await client.post(settings.DINGTALK_WEBHOOK_URL, json=payload, timeout=5)
    except Exception:
        pass  # notification failures must not break the main request

async def _broadcast_role(role: UserRole, text: str, db: Session):
    users = db.query(User).filter(User.role == role).all()
    await asyncio.gather(*[_send(u.notification_handle, u.notification_platform, text) for u in users])

async def notify_new_request(req: DeployRequest, db: Session):
    msg = f"【新部署申请】{req.applicant.name} 提交了申请\n项目：{req.project_name} {req.product_version}\n编号：{req.req_no}"
    await _broadcast_role(UserRole.pm, msg, db)

async def notify_approved(req: DeployRequest, db: Session):
    msg = f"【申请已通过】{req.req_no} 已通过审批\n项目：{req.project_name}，请提供部署资源"
    await _broadcast_role(UserRole.tester, msg, db)

async def notify_rejected(req: DeployRequest, db: Session):
    msg = f"【申请被拒绝】{req.req_no} 审批未通过\n项目：{req.project_name}"
    await _send(req.applicant.notification_handle, req.applicant.notification_platform, msg)

async def notify_resource_ready(req: DeployRequest, db: Session):
    msg = f"【资源已就绪】{req.req_no} 部署资源已配置完成\n项目：{req.project_name}，请开始部署"
    await _send(req.applicant.notification_handle, req.applicant.notification_platform, msg)

async def notify_completed(req: DeployRequest, db: Session):
    msg = f"【部署完成】{req.req_no} 已完成部署\n项目：{req.project_name} {req.product_version}"
    await _broadcast_role(UserRole.pm, msg, db)
