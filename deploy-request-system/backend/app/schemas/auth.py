from pydantic import BaseModel
from app.models.models import UserRole, NotificationPlatform

class RegisterIn(BaseModel):
    username: str
    password: str
    name: str
    role: UserRole
    notification_platform: NotificationPlatform
    notification_handle: str = ""

class UserOut(BaseModel):
    id: int
    username: str
    name: str
    role: UserRole
    notification_platform: NotificationPlatform
    model_config = {"from_attributes": True}

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
