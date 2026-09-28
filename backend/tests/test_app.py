import os, random, tempfile
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(tempfile.mkdtemp(), "t.db")
os.environ["SECRET_KEY"] = "test-secret"
import uuid
from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.question_engine import build, random_spec, sign, verify, spec_from_key, key_of

def alpha(ty, i): return build({"k": "alpha", "ty": ty, "i": i})

def test_alphabet_values():
    assert alpha(1, 9)["correct_answer"] == "10"      # J
    assert alpha(2, 9)["correct_answer"] == "17"      # J reverse
    assert alpha(3, 16)["correct_answer"] == "Q"      # 17 forward
    assert build({"k": "alpha", "ty": 4, "i": 16})["question"].endswith("value 10?")
    assert build({"k": "alpha", "ty": 4, "i": 16})["correct_answer"] == "Q"
    assert build({"k": "alpha", "ty": 3, "i": 16})["question"].endswith("value 17?")

def test_math_answers():
    assert build({"k": "mul", "a": 24, "b": 7})["correct_answer"] == "168"
    assert build({"k": "sq", "n": 17, "ty": 1})["correct_answer"] == "289"
    assert build({"k": "sq", "n": 17, "ty": 2})["correct_answer"] == "17"
    assert build({"k": "cu", "n": 13, "ty": 1})["correct_answer"] == "2197"

@pytest.mark.parametrize("topic", ["alpha_fwd", "alpha_rev", "alpha_mix", "tab_2_10", "tab_11_20", "tab_21_28",
                                   "tab_2_28", "tab_c_5_6", "squares", "cubes", "quick"])
def test_generation_valid(topic):
    rng = random.Random(1)
    for _ in range(300):
        q = build(random_spec(topic, rng), rng)
        assert len(q["options"]) == 4 and len(set(q["options"])) == 4
        assert q["options"].count(q["correct_answer"]) == 1
        if q["question_type"] in ("multiplication", "square", "cube"):
            assert all(int(o) > 0 for o in q["options"])

def test_token_tamper_and_key_roundtrip():
    spec = {"k": "mul", "a": 12, "b": 5}
    tok = sign(spec)
    assert verify(tok) == spec
    assert verify(tok[:-1] + ("0" if tok[-1] != "0" else "1")) is None
    assert key_of(spec_from_key(key_of(spec), random.Random())) == "mul:12x5"

@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c

def hdr(u): return {"X-User-Id": u}

def answer_q(c, u, sid, correct=True, topic="tab_2_28", mode="focus"):
    q = c.get(f"/api/question?mode={mode}&topic={topic}", headers=hdr(u)).json()
    assert "correct_answer" not in q
    spec = verify(q["id"]); right = build(spec)["correct_answer"]
    pick = right if correct else next(o for o in q["options"] if o != right)
    r = c.post("/api/attempt", headers=hdr(u), json={"question_id": q["id"], "selected_answer": pick,
                                                      "session_id": sid, "response_time_ms": 1500})
    assert r.status_code == 200
    assert r.json()["is_correct"] is correct and r.json()["correct_answer"] == right
    return q

def test_flow_isolation_and_weak(client):
    a, b = str(uuid.uuid4()), str(uuid.uuid4())
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.post("/api/users", headers=hdr(a)).status_code == 200
    assert client.get("/api/stats").status_code == 422
    assert client.get("/api/stats", headers=hdr("nope")).status_code == 400
    sid = client.post("/api/session/start", headers=hdr(a), json={"mode": "focus", "topic": "tab_2_28"}).json()["id"]
    for ok in (True, True, False, True, False, False):
        answer_q(client, a, sid, ok)
    s = client.get("/api/stats", headers=hdr(a)).json()
    assert s["total_questions"] == 6 and s["correct"] == 3 and s["accuracy"] == 50
    assert s["best_streak"] == 2 and s["current_streak"] == 0 and s["today"] == 6
    assert client.get("/api/stats", headers=hdr(b)).json()["total_questions"] == 0
    assert client.post("/api/session/end", headers=hdr(b), json={"session_id": sid}).status_code == 404
    end = client.post("/api/session/end", headers=hdr(a), json={"session_id": sid}).json()
    assert end["questions"] == 6 and end["correct"] == 3 and end["incorrect"] == 3 and end["accuracy"] == 50
    assert client.post("/api/attempt", headers=hdr(a), json={"question_id": "x" * 20 + ".abc", "selected_answer": "1"}).status_code == 400
    weak = client.get("/api/weak-areas", headers=hdr(a)).json()["items"]
    assert len(weak) == 3 and all(i["incorrect"] > 0 for i in weak)
    assert client.get("/api/weak-areas", headers=hdr(b)).json()["items"] == []
    w = client.get("/api/question?mode=weak", headers=hdr(a)).json()
    assert w["learning_item_key"] in {i["key"] for i in weak}

def test_srs_weights():
    from app.algorithms.srs import update_item, weight
    from app.models import LearningItem, utcnow
    now = utcnow()
    it = LearningItem(attempts=0, correct_count=0, incorrect_count=0, current_streak=0, difficulty=2.0, next_review_at=now)
    update_item(it, False, now); update_item(it, False, now)
    hard = weight(it, now + timedelta(minutes=5))
    for _ in range(4): update_item(it, True, now)
    assert it.next_review_at > now + timedelta(hours=1)
    assert weight(it, now) < hard
