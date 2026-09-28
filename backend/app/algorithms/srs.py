"""Simple weighted spaced repetition.
Wrong  -> streak reset, difficulty +1 (max 5), due again in 1 minute.
Right  -> streak +1, difficulty -0.3 (min 1), next review 10 * 3^(streak-1) minutes (max 30 days).
Weak-area picking is a weighted random draw: difficulty^2, x4 when due, /2 when streak >= 3."""
import random
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import LearningItem
from ..question_engine import spec_from_key

MAX_MINUTES = 60 * 24 * 30

def update_item(item: LearningItem, correct: bool, now: datetime) -> None:
    item.attempts += 1
    item.last_seen_at = now
    if correct:
        item.correct_count += 1
        item.current_streak += 1
        item.difficulty = max(1.0, item.difficulty - 0.3)
        item.next_review_at = now + timedelta(minutes=min(MAX_MINUTES, 10 * 3 ** min(item.current_streak - 1, 10)))
    else:
        item.incorrect_count += 1
        item.current_streak = 0
        item.difficulty = min(5.0, item.difficulty + 1.0)
        item.next_review_at = now + timedelta(minutes=1)

def weight(item: LearningItem, now: datetime) -> float:
    w = item.difficulty ** 2
    if item.next_review_at <= now:
        w *= 4
    if item.current_streak >= 3:
        w /= 2
    return w

def weak_items(db: Session, user_id: int, now: datetime, limit: int = 10) -> list[LearningItem]:
    rows = db.scalars(select(LearningItem).where(LearningItem.user_id == user_id, LearningItem.incorrect_count > 0)).all()
    return sorted(rows, key=lambda i: weight(i, now), reverse=True)[:limit]

def pick_weak(db: Session, user_id: int, exclude: set[str], rng: random.Random, now: datetime):
    items = [i for i in weak_items(db, user_id, now, 50) if i.item_key not in exclude and i.current_streak < 5]
    if not items:
        return None
    chosen = rng.choices(items, weights=[weight(i, now) for i in items], k=1)[0]
    return spec_from_key(chosen.item_key, rng)
