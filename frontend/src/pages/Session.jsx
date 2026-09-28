import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { Loading, ErrorState } from "../components/States";
import Icon from "../components/Icons";
import { TOPIC_LABEL, clock, secs } from "../utils/format";

const TOTAL = 20;

export default function Session() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const mode = sp.get("mode") || "quick";
  const topic = sp.get("topic") || "quick";
  const limit = mode === "timed" ? parseInt(sp.get("secs"), 10) || 180 : 0;

  const [phase, setPhase] = useState("loading");
  const [err, setErr] = useState("");
  const [q, setQ] = useState(null);
  const [result, setResult] = useState(null);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(0);
  const [right, setRight] = useState(0);
  const [left, setLeft] = useState(limit);
  const [summary, setSummary] = useState(null);
  const sid = useRef(null), recent = useRef([]), t0 = useRef(0), busy = useRef(false), ending = useRef(false), endAt = useRef(0);

  const loadQuestion = useCallback(async () => {
    const ex = recent.current.slice(-8).join(",");
    const data = await api.get(`/api/question?mode=${mode}&topic=${topic}&exclude=${encodeURIComponent(ex)}`);
    recent.current.push(data.learning_item_key);
    setQ(data); setResult(null); setPicked(null); t0.current = performance.now(); setPhase("question");
  }, [mode, topic]);

  const finish = useCallback(async () => {
    if (ending.current || !sid.current) return;
    ending.current = true;
    try { setSummary(await api.post("/api/session/end", { session_id: sid.current })); setPhase("summary"); }
    catch (e) { ending.current = false; setErr(e.message); setPhase("error"); }
  }, []);

  const start = useCallback(async () => {
    setPhase("loading"); setDone(0); setRight(0); ending.current = false; recent.current = [];
    try {
      if (!sid.current) sid.current = (await api.post("/api/session/start", { mode, topic })).id;
      if (limit && !endAt.current) endAt.current = Date.now() + limit * 1000;
      await loadQuestion();
    } catch (e) { setErr(e.message); setPhase("error"); }
  }, [mode, topic, limit, loadQuestion]);

  useEffect(() => { start(); }, [start]);

  useEffect(() => {
    if (!limit) return;
    const id = setInterval(() => {
      if (!endAt.current) return;
      const s = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) finish();
    }, 500);
    return () => clearInterval(id);
  }, [limit, finish]);

  const answer = useCallback(async (opt) => {
    if (busy.current || result || phase !== "question") return;
    busy.current = true; setPicked(opt);
    try {
      const r = await api.post("/api/attempt", { question_id: q.id, selected_answer: opt, session_id: sid.current, response_time_ms: Math.round(performance.now() - t0.current) });
      setResult(r); setDone((d) => d + 1); setRight((c) => c + (r.is_correct ? 1 : 0));
    } catch (e) { setPicked(null); setErr(e.message); setPhase("error"); }
    finally { busy.current = false; }
  }, [q, result, phase]);

  const next = useCallback(async () => {
    if (busy.current || !result) return;
    if (!limit && done >= TOTAL) return finish();
    busy.current = true;
    try { await loadQuestion(); } catch (e) { setErr(e.message); setPhase("error"); } finally { busy.current = false; }
  }, [result, limit, done, finish, loadQuestion]);

  useEffect(() => {
    const onKey = (e) => {
      if (phase !== "question" || !q) return;
      if (!result && ["1", "2", "3", "4"].includes(e.key)) answer(q.options[+e.key - 1]);
      else if (result && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, q, result, answer, next]);

  const retry = () => { if (q && sid.current && phase === "error") { setPhase("question"); } else start(); };

  if (phase === "loading") return <Loading text="Preparing your session…" />;
  if (phase === "error") return <ErrorState message={err} onRetry={q ? () => { if (ending.current === false && result) next(); else retry(); } : start} />;

  if (phase === "summary") {
    const cells = [["Questions", summary.questions], ["Correct", summary.correct], ["Incorrect", summary.incorrect], ["Accuracy", summary.accuracy + "%"], ["Avg time", secs(summary.avg_response_ms)], ["Per minute", summary.questions_per_minute]];
    return (
      <div className="space-y-6 pt-6 text-center">
        <h1 className="text-3xl font-black">Session complete</h1>
        <p className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-7xl font-black text-transparent">{summary.accuracy}%</p>
        <dl className="grid grid-cols-2 gap-3 text-left">
          {cells.map(([l, v]) => <div key={l} className="card p-4"><dt className="label">{l}</dt><dd className="mt-1 text-3xl font-black">{v}</dd></div>)}
        </dl>
        <div className="grid gap-3">
          <button className="btn-primary" onClick={() => { sid.current = null; endAt.current = 0; setLeft(limit); start(); }}>Practice Again</button>
          <button className="btn-ghost" onClick={() => nav("/")}>Back to Home</button>
        </div>
      </div>
    );
  }

  const isRight = result?.is_correct;
  const pct = limit ? (left / limit) * 100 : (done / TOTAL) * 100;
  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-5 pb-40">
      <div className="flex items-center gap-3">
        <button aria-label="End session" onClick={finish} className="btn-ghost !min-h-[44px] !px-3"><Icon name="x" className="h-5 w-5" /></button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="min-w-[3.5rem] text-right text-sm font-bold tabular-nums text-slate-300">{limit ? clock(left) : `${done}/${TOTAL}`}</span>
      </div>
      <p className="text-center label">{TOPIC_LABEL[q.topic] || q.topic} · {right}/{done} correct</p>
      <h1 key={q.id} className="pop py-6 text-center text-[2.6rem] font-black leading-tight tracking-tight">{q.question}</h1>
      <div className="grid gap-3" role="group" aria-label="Answer options">
        {q.options.map((o, i) => {
          const showCorrect = result && o === result.correct_answer;
          const showWrong = result && o === picked && !result.is_correct;
          const tone = showCorrect ? "border-emerald-400 bg-emerald-400/15" : showWrong ? "border-rose-400 bg-rose-400/15" : "border-white/10 bg-white/5";
          return (
            <button key={o} onClick={() => answer(o)} disabled={!!result || picked !== null} aria-label={`Option ${"ABCD"[i]}: ${o}`}
              className={`flex min-h-[68px] items-center gap-4 rounded-2xl border px-5 text-left text-2xl font-bold transition active:scale-[.98] ${tone} ${!result && picked === null ? "hover:bg-white/10" : ""}`}>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-sm text-slate-300">{"ABCD"[i]}</span>
              <span className="flex-1">{o}</span>
              {showCorrect && <Icon name="check" className="h-6 w-6 text-emerald-300" />}
              {showWrong && <Icon name="x" className="h-6 w-6 text-rose-300" />}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-xl px-4 pb-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        {result && (
          <div className={`pop card space-y-3 p-4 ${isRight ? "!border-emerald-400/50" : "!border-rose-400/50"}`}>
            <div className="flex items-center gap-2">
              <Icon name={isRight ? "check" : "x"} className={`h-6 w-6 ${isRight ? "text-emerald-300" : "text-rose-300"}`} />
              <p className="text-xl font-black">{isRight ? "Correct!" : "Incorrect"}</p>
            </div>
            <p className="text-slate-300">{isRight ? result.explanation : `Correct answer: ${result.correct_answer}  ·  ${result.explanation}`}</p>
            <button onClick={next} autoFocus className="btn-primary w-full">{!limit && done >= TOTAL ? "Finish" : "Next"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
