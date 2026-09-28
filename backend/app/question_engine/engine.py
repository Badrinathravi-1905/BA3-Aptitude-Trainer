"""Deterministic question generation. The correct answer is always recomputed
server-side from a signed spec token, so the client is never trusted."""
import base64, hashlib, hmac, json, random, string
from ..config import SECRET_KEY

L = string.ascii_uppercase
BAND_LABELS = {"alpha": "Alphabet", "tables_2_10": "Tables 2–10", "tables_11_20": "Tables 11–20",
               "tables_21_28": "Tables 21–28", "squares": "Squares", "cubes": "Cubes"}
ALPHA_TOPICS = {"alpha_fwd": (1, 3), "alpha_rev": (2, 4), "alpha_mix": (1, 2, 3, 4)}

def table_range(topic: str) -> tuple[int, int]:
    parts = topic.split("_")
    try:
        lo, hi = int(parts[-2]), int(parts[-1])
    except (ValueError, IndexError):
        raise ValueError("Bad table range")
    if not (2 <= lo <= hi <= 28):
        raise ValueError("Table range must be within 2-28")
    return lo, hi

def random_spec(topic: str, rng: random.Random) -> dict:
    if topic == "quick":
        topic = rng.choice(("alpha_mix", "tab_2_28", "tab_2_28", "squares", "cubes"))
    if topic in ALPHA_TOPICS:
        return {"k": "alpha", "ty": rng.choice(ALPHA_TOPICS[topic]), "i": rng.randrange(26)}
    if topic == "squares":
        return {"k": "sq", "n": rng.randint(1, 30), "ty": rng.choice((1, 1, 1, 2))}
    if topic == "cubes":
        return {"k": "cu", "n": rng.randint(1, 20), "ty": 1}
    if topic.startswith("tab_"):
        lo, hi = table_range(topic)
        return {"k": "mul", "a": rng.randint(lo, hi), "b": rng.randint(2, 12)}
    raise ValueError("Unknown topic")

def key_of(s: dict) -> str:
    k = s["k"]
    if k == "alpha":
        return f"alpha:{L[s['i']]}:{'f' if s['ty'] in (1, 3) else 'r'}"
    if k == "mul":
        return f"mul:{s['a']}x{s['b']}"
    return f"{k}:{s['n']}"

def spec_from_key(key: str, rng: random.Random) -> dict:
    kind, *rest = key.split(":")
    if kind == "alpha":
        ch, d = rest
        return {"k": "alpha", "ty": rng.choice((1, 3) if d == "f" else (2, 4)), "i": L.index(ch)}
    if kind == "mul":
        a, b = rest[0].split("x")
        return {"k": "mul", "a": int(a), "b": int(b)}
    if kind == "sq":
        return {"k": "sq", "n": int(rest[0]), "ty": rng.choice((1, 1, 2))}
    return {"k": "cu", "n": int(rest[0]), "ty": 1}

def band(s: dict) -> str:
    if s["k"] == "mul":
        a = s["a"]
        return "tables_2_10" if a <= 10 else "tables_11_20" if a <= 20 else "tables_21_28"
    return {"alpha": "alpha", "sq": "squares", "cu": "cubes"}[s["k"]]

def label(key: str) -> str:
    kind, *rest = key.split(":")
    if kind == "alpha":
        return f"{rest[0]} ({'forward' if rest[1] == 'f' else 'reverse'})"
    if kind == "mul":
        return rest[0].replace("x", " × ")
    return f"{rest[0]}{'²' if kind == 'sq' else '³'}"

def _four(correct, cands, lo, hi, rng):
    pool = list({c for c in cands if lo <= c <= hi and c != correct})
    rng.shuffle(pool)
    opts = [correct] + pool[:3]
    span, tries = max(3, abs(correct) // 5 + 5), 0
    while len(opts) < 4:
        c = correct + rng.randint(-span, span)
        if lo <= c <= hi and c not in opts:
            opts.append(c)
        tries += 1
        if tries > 100:
            span *= 2
    rng.shuffle(opts)
    return opts

def build(s: dict, rng: random.Random | None = None) -> dict:
    rng = rng or random.Random()
    k = s["k"]
    if k == "alpha":
        i, ty = s["i"], s["ty"]
        ch, f, r = L[i], s["i"] + 1, 26 - s["i"]
        if ty in (1, 2):
            n = f if ty == 1 else r
            text = f"What is the {'numerical' if ty == 1 else 'reverse numerical'} value of {ch}?"
            opts = [str(o) for o in _four(n, [n - 1, n + 1, n - 2, n + 2, 27 - n, n + 10, n - 10], 1, 26, rng)]
            correct, expl = str(n), f"{ch} = {n}" + ("" if ty == 1 else " (reverse)")
            qtype = "alpha_value" if ty == 1 else "alpha_reverse_value"
        else:
            num = f if ty == 3 else r
            text = f"Which alphabet has the {'' if ty == 3 else 'reverse '}numerical value {num}?"
            opts = [L[o] for o in _four(i, [i - 1, i + 1, i - 2, i + 2, 25 - i], 0, 25, rng)]
            correct, expl = ch, f"{num} = {ch}" + ("" if ty == 3 else " (reverse)")
            qtype = "alpha_letter" if ty == 3 else "alpha_reverse_letter"
        diff = 1
    elif k == "mul":
        a, b = s["a"], s["b"]
        p = a * b
        text, qtype, expl = f"What is {a} × {b}?", "multiplication", f"{a} × {b} = {p}"
        cands = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, p + 10, p - 10, p + a, p - a, p + b, p - b]
        opts = [str(o) for o in _four(p, cands, 1, 10**6, rng)]
        correct, diff = str(p), (2 if a <= 20 else 3)
    elif k == "sq":
        n = s["n"]
        p = n * n
        expl = f"{n}² = {p}"
        if s.get("ty") == 2:
            text, qtype, correct = f"Which number has a square of {p}?", "square_root", str(n)
            opts = [str(o) for o in _four(n, [n - 1, n + 1, n - 2, n + 2, n + 3, n - 3], 1, 30, rng)]
        else:
            text, qtype, correct = f"What is {n}²?", "square", str(p)
            cands = [(n - 1) ** 2, (n + 1) ** 2, (n + 2) ** 2, (n - 2) ** 2, p + n, p - n, p + 10, p - 10]
            opts = [str(o) for o in _four(p, cands, 1, 10**6, rng)]
        diff = 2
    else:
        n = s["n"]
        p = n ** 3
        text, qtype, expl, correct, diff = f"What is {n}³?", "cube", f"{n}³ = {p}", str(p), 3
        cands = [(n - 1) ** 3, (n + 1) ** 3, (n + 2) ** 3, (n - 2) ** 3, p + n * n, p - n * n, p + 100, p - 100]
        opts = [str(o) for o in _four(p, cands, 1, 10**7, rng)]
    return {"topic": band(s), "question_type": qtype, "question": text, "options": opts,
            "correct_answer": correct, "explanation": expl, "learning_item_key": key_of(s), "difficulty": diff}

def sign(spec: dict) -> str:
    raw = base64.urlsafe_b64encode(json.dumps(spec, sort_keys=True, separators=(",", ":")).encode()).decode().rstrip("=")
    sig = hmac.new(SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()[:24]
    return f"{raw}.{sig}"

def verify(token: str) -> dict | None:
    try:
        raw, sig = token.rsplit(".", 1)
        good = hmac.new(SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()[:24]
        if not hmac.compare_digest(sig, good):
            return None
        spec = json.loads(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))
        build(spec)
        return spec
    except Exception:
        return None
