from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import QuestionAttempt
from ..question_engine import BAND_LABELS

def compute_stats(db: Session, user_id: int, now: datetime) -> dict:
    rows = db.execute(
        select(QuestionAttempt.is_correct, QuestionAttempt.topic, QuestionAttempt.response_time_ms, QuestionAttempt.created_at)
        .where(QuestionAttempt.user_id == user_id)
        .order_by(QuestionAttempt.created_at.desc(), QuestionAttempt.id.desc())
    ).all()
    total = len(rows)
    correct = sum(1 for r in rows if r.is_correct)
    current = 0
    for r in rows:
        if not r.is_correct:
            break
        current += 1
    best = run = 0
    for r in rows:
        run = run + 1 if r.is_correct else 0
        best = max(best, run)
    today = sum(1 for r in rows if r.created_at.date() == now.date())
    bands: dict[str, list[int]] = {}
    for r in rows:
        b = bands.setdefault(r.topic, [0, 0])
        b[0] += 1
        b[1] += int(r.is_correct)
    topics = [{"band": k, "label": BAND_LABELS.get(k, k), "attempts": v[0], "accuracy": round(100 * v[1] / v[0])}
              for k, v in bands.items()]
    ranked = sorted([t for t in topics if t["attempts"] >= 5], key=lambda t: t["accuracy"])
    return {
        "total_questions": total,
        "correct": correct,
        "accuracy": round(100 * correct / total) if total else 0,
        "current_streak": current,
        "best_streak": best,
        "avg_response_ms": round(sum(r.response_time_ms for r in rows) / total) if total else 0,
        "today": today,
        "weakest": ranked[0] if ranked else None,
        "strongest": ranked[-1] if len(ranked) > 1 else None,
        "topics": sorted(topics, key=lambda t: t["label"]),
    }
