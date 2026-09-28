import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icons";
import { TOPICS } from "../utils/format";

const MODES = [["quick", "Quick"], ["focus", "Focus"], ["weak", "Weak"], ["timed", "Timed"]];
const AREA = { alpha: "alpha_mix", tables: "tab_2_28", squares: "squares", cubes: "cubes" };
const MINS = [1, 3, 5, 10];

const Chip = ({ on, children, ...p }) => (
  <button aria-pressed={on} {...p} className={`min-h-[48px] rounded-2xl border px-4 text-sm font-semibold transition ${on ? "border-cyan-300 bg-cyan-300/15 text-cyan-200" : "border-white/10 bg-white/5 text-slate-300"}`}>{children}</button>
);

export default function Practice() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const area = sp.get("area");
  const [mode, setMode] = useState(area ? "focus" : "quick");
  const [topic, setTopic] = useState(AREA[area] || "tab_2_28");
  const [mins, setMins] = useState(3);
  const [lo, setLo] = useState(2);
  const [hi, setHi] = useState(10);
  const customOk = Number.isInteger(lo) && Number.isInteger(hi) && lo >= 2 && hi <= 28 && lo <= hi;
  const isCustom = topic === "custom";
  const canStart = !(mode === "focus" || mode === "timed") || !isCustom || customOk;

  const start = () => {
    const t = mode === "quick" || mode === "weak" ? "quick" : isCustom ? `tab_c_${lo}_${hi}` : topic;
    const q = new URLSearchParams({ mode, topic: t });
    if (mode === "timed") q.set("secs", String(mins * 60));
    nav(`/session?${q}`);
  };
  const showTopics = mode === "focus" || mode === "timed";
  const blurb = { quick: "A random mix of every area.", focus: "Drill one area at a time.", weak: "Smart repeats of what you miss.", timed: "Beat the clock." }[mode];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight">Practice</h1>
      <div role="tablist" aria-label="Practice mode" className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
        {MODES.map(([id, l]) => (
          <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
            className={`min-h-[48px] rounded-xl text-sm font-bold transition ${mode === id ? "bg-gradient-to-r from-indigo-500 to-cyan-400 text-ink" : "text-slate-300"}`}>{l}</button>
        ))}
      </div>
      <p className="text-slate-400">{blurb}</p>
      {showTopics && (
        <section aria-label="Choose topic" className="space-y-3">
          <p className="label">Topic</p>
          <div className="grid grid-cols-2 gap-2">
            {mode === "timed" && <Chip on={topic === "quick"} onClick={() => setTopic("quick")}>All areas</Chip>}
            {TOPICS.map((t) => <Chip key={t.id} on={topic === t.id} onClick={() => setTopic(t.id)}>{t.label}</Chip>)}
            <Chip on={isCustom} onClick={() => setTopic("custom")}>Custom tables</Chip>
          </div>
          {isCustom && (
            <div className="card grid grid-cols-2 gap-3 p-4">
              {[["From", lo, setLo], ["To", hi, setHi]].map(([l, v, set]) => (
                <label key={l} className="grid gap-1 text-sm text-slate-400">{l}
                  <input type="number" inputMode="numeric" min="2" max="28" value={Number.isNaN(v) ? "" : v} onChange={(e) => set(parseInt(e.target.value, 10))}
                    className="min-h-[52px] rounded-xl border border-white/10 bg-ink px-4 text-xl font-bold text-white" />
                </label>
              ))}
              {!customOk && <p role="alert" className="col-span-2 text-sm text-rose-300">Enter numbers from 2 to 28 (From ≤ To).</p>}
            </div>
          )}
        </section>
      )}
      {mode === "timed" && (
        <section aria-label="Duration" className="space-y-3">
          <p className="label">Duration</p>
          <div className="grid grid-cols-4 gap-2">{MINS.map((m) => <Chip key={m} on={mins === m} onClick={() => setMins(m)}>{m} min</Chip>)}</div>
        </section>
      )}
      <button onClick={start} disabled={!canStart} className="btn-primary w-full"><Icon name="play" className="h-5 w-5" />Start</button>
    </div>
  );
}
