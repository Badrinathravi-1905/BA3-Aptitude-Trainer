import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import ALLOWED_ORIGINS
from .database import Base, engine
from . import models  # noqa: F401  (register tables)
from .routers.api import router

log = logging.getLogger("ba3")

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if not ALLOWED_ORIGINS:
        log.warning("ALLOWED_ORIGINS is empty: browsers on other origins will be blocked by CORS.")
    yield

app = FastAPI(title="BA3 Aptitude Trainer API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET", "POST", "OPTIONS"],
                   allow_headers=["Content-Type", "X-User-Id"])
app.include_router(router)

@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    log.exception("Unhandled error: %s", exc)
    return JSONResponse({"detail": "Something went wrong. Please try again."}, status_code=500)
