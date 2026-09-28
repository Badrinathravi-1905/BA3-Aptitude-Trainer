from pydantic import BaseModel, Field

class AttemptIn(BaseModel):
    question_id: str = Field(min_length=10, max_length=400)
    selected_answer: str = Field(min_length=1, max_length=16)
    session_id: int | None = None
    response_time_ms: int = Field(default=0, ge=0, le=600000)

class SessionStartIn(BaseModel):
    mode: str = Field(pattern="^(quick|focus|weak|timed)$")
    topic: str = Field(default="quick", max_length=32)

class SessionEndIn(BaseModel):
    session_id: int
