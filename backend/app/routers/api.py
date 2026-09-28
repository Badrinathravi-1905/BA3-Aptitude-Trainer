import random, uuid
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..algorithms import srs
from ..database import get_db
from ..models import LearningItem, PracticeSession, QuestionAttempt, User, utcnow
from ..question_engine import build, key_of, label, random_spec, sign, verify
from ..schemas import AttemptIn, SessionEndIn, SessionStartIn
from ..services.stats import compute_stats

router = APIRouter(prefix="/api")

def current_user(x_user_id: str = Header(...), db: Session = Depends(get_db)) -> User:
    try:
        uid = str(uuid.UUID(x_user_id))
    except ValueError:
        raise HTTPException(400, "Invalid user id")
    user = db.scalar(select(User).where(User.uuid == uid))
    if not user:
        user = User(uuid=uid)
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            user = db.scalar(select(User).where(User.uuid == uid))
    user.last_active_at = utcnow()
    db.commit()
    return user

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/users")
def create_user(user: User = Depends(current_user)):
    return {"user_id": user.uuid, "created_at": user.created_at}

@router.get("/question")
def get_question(mode: str = "quick", topic: str = "quick", exclude: str = "",
                 user: User = Depends(current_user), db: Session = Depends(get_db)):
    rng = random.Random()
    ex = {e for e in exclude.split(",") if e}
    spec = srs.pick_weak(db, user.id, ex, rng, utcnow()) if mode == "weak" else None
    if spec is None:
        for _ in range(40):
            try:
                spec = random_spec(topic, rng)
            except ValueError:
                raise HTTPException(400, "Unknown topic")
            if key_of(spec) not in ex:
                break
    q = build(spec, rng)
    return {"id": sign(spec), "topic": q["topic"], "question_type": q["question_type"], "question": q["question"],
            "options": q["options"], "learning_item_key": q["learning_item_key"], "difficulty": q["difficulty"]}

@router.post("/session/start")
def session_start(body: SessionStartIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    s = PracticeSession(user_id=user.id, mode=body.mode, topic=body.topic)
    db.add(s)
    db.commit()
    return {"id": s.id}

def _owned_session(db: Session, user: User, sid: int) -> PracticeSession:
    s = db.get(PracticeSession, sid)
    if not s or s.user_id != user.id:
        raise HTTPException(404, "Session not found")
    return s

@router.post("/attempt")
def attempt(body: AttemptIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    spec = verify(body.question_id)
    if spec is None:
        raise HTTPException(400, "Invalid question")
    sess = _owned_session(db, user, body.session_id) if body.session_id else None
    if sess and sess.ended_at:
        raise HTTPException(409, "Session already ended")
    q = build(spec)
    ok = body.selected_answer == q["correct_answer"]
    now = utcnow()
    db.add(QuestionAttempt(user_id=user.id, session_id=sess.id if sess else None, topic=q["topic"],
                           question_type=q["question_type"], question_text=q["question"],
                           correct_answer=q["correct_answer"], selected_answer=body.selected_answer,
                           is_correct=ok, response_time_ms=body.response_time_ms, created_at=now))
    item = db.scalar(select(LearningItem).where(LearningItem.user_id == user.id, LearningItem.item_key == q["learning_item_key"]))
    if not item:
        item = LearningItem(user_id=user.id, topic=q["topic"], item_key=q["learning_item_key"], attempts=0,
                            correct_count=0, incorrect_count=0, current_streak=0, difficulty=2.0, next_review_at=now)
        db.add(item)
    srs.update_item(item, ok, now)
    if sess:
        sess.questions_answered += 1
        sess.correct_answers += int(ok)
    db.commit()
    return {"is_correct": ok, "correct_answer": q["correct_answer"], "explanation": q["explanation"],
            "item_streak": item.current_streak}

@router.post("/session/end")
def session_end(body: SessionEndIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    s = _owned_session(db, user, body.session_id)
    if not s.ended_at:
        s.ended_at = utcnow()
        db.commit()
    avg = db.scalar(select(func.avg(QuestionAttempt.response_time_ms)).where(QuestionAttempt.session_id == s.id)) or 0
    mins = max((s.ended_at - s.started_at).total_seconds() / 60, 1 / 60)
    n = s.questions_answered
    return {"questions": n, "correct": s.correct_answers, "incorrect": n - s.correct_answers,
            "accuracy": round(100 * s.correct_answers / n) if n else 0, "avg_response_ms": round(avg),
            "questions_per_minute": round(n / mins, 1)}

@router.get("/stats")
@router.get("/progress")
def stats(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return compute_stats(db, user.id, utcnow())

@router.get("/weak-areas")
def weak_areas(user: User = Depends(current_user), db: Session = Depends(get_db)):
    now = utcnow()
    items = srs.weak_items(db, user.id, now, 10)
    return {"items": [{"key": i.item_key, "label": label(i.item_key), "band": i.topic, "attempts": i.attempts,
                       "correct": i.correct_count, "incorrect": i.incorrect_count, "streak": i.current_streak,
                       "due": i.next_review_at <= now} for i in items]}
