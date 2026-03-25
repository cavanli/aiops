from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    WECHAT_WEBHOOK_URL: str = ""
    DINGTALK_WEBHOOK_URL: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
