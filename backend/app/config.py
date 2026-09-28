import os
from dotenv import load_dotenv

load_dotenv()

def _db_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url

DATABASE_URL = _db_url(os.getenv("DATABASE_URL", "sqlite:///./ba3.db"))
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-change-me")
