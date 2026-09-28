import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { Loading, ErrorState } from "../components/States";
import { secs } from "../utils/format";

const Stat = ({ v, l }) => <div className="card p-4"><p className="text-3xl font-black tabular-nums">{v}</p><p className="label mt-1">{l}</p></div>;

export default function Progress() {
  const s = useFetch("/api/stats");
  const w = useFetch("/api/weak-areas");
  if (s.loading || w.loading) return <Loading />;
  if (s.error || w.error) return <ErrorState message={s.error || w.error} onRetry={() => { s.reload(); w.reload(); }} />;
  const d = s.data;
  if (!d.total_questions) {
    return (
      <div className="card mt-10 grid place-items-center gap-4 p-10 text-center">
        <p className="text-xl font-bold">No practice yet</p><p className="text-slate-400">Answer a few questions and your stats will appear here.</p>
        <Link to="/session?mode=quick&topic=quick" className="btn-primary w-full">Start Quick Practice</Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight">Progress</h1>
      <div className="card bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 p-6">
        <p className="bg-gradient-to-r from-indigo-200 to-cyan-200 bg-clip-text text-6xl font-black text-transparent">{d.accuracy}%</p>
        <p className="label mt-1">Overall accuracy</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat v={d.total_questions.toLocaleString()} l="Questions" /><Stat v={d.today} l="Today" />
        <Stat v={d.current_streak} l="Current streak" /><Stat v={d.best_streak} l="Best streak" />
        <Stat v={secs(d.avg_response_ms)} l="Avg response" />
        <Stat v={d.strongest?.label ?? "–"} l="Strongest" />
        <div className="col-span-2"><Stat v={d.weakest?.label ?? "Need 5+ answers"} l="Weakest topic" /></div>
      </div>
      <section className="card space-y-4 p-5">
        <h2 className="label">Accuracy by topic</h2>
        {d.topics.map((t) => (
          <div key={t.band}>
            <div className="mb-1 flex justify-between text-sm"><span>{t.label}</span><span className="tabular-nums text-slate-400">{t.accuracy}% · {t.attempts}</span></div>
            <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${t.accuracy}%` }} /></div>
          </div>
        ))}
      </section>
      <section className="card p-5">
        <h2 className="label mb-3">Needs work</h2>
        {w.data.items.length === 0 ? <p className="text-slate-400">No mistakes recorded. Nice.</p> : (
          <ul className="divide-y divide-white/10">
            {w.data.items.map((i) => (
              <li key={i.key} className="flex items-center justify-between py-3"><span className="text-lg font-bold">{i.label}</span>
                <span className="text-sm text-slate-400">{i.incorrect} wrong · {i.correct} right</span></li>
            ))}
          </ul>
        )}
        <Link to="/session?mode=weak" className="btn-primary mt-4 w-full">Practice Weak Areas</Link>
      </section>
    </div>
  );
}
