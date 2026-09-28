import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Icon from "../components/Icons";

const TILES = [["alpha", "Alphabet", "A–Z values", "A1"], ["tables", "Tables", "2 to 28", "×"], ["squares", "Squares", "1² – 30²", "x²"], ["cubes", "Cubes", "1³ – 20³", "x³"]];

export default function Home() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3"><Logo /><span className="label">Creator · BA3</span></header>
      <section className="card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
        <p className="label">Aptitude Trainer</p>
        <h1 className="mt-2 text-4xl font-black leading-[1.05] tracking-tight">BA3 <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">Aptitude Trainer</span></h1>
        <p className="mt-3 text-slate-300">Build speed. Build accuracy. Build recall.</p>
        <Link to="/session?mode=quick&topic=quick" className="btn-primary mt-6 w-full"><Icon name="bolt" className="h-5 w-5" />Quick Practice</Link>
      </section>
      <section aria-label="Practice areas" className="grid grid-cols-2 gap-3">
        {TILES.map(([area, title, sub, glyph]) => (
          <Link key={area} to={`/practice?area=${area}`} className="card group p-5 transition hover:bg-white/[0.08] active:scale-[.98]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/15 text-lg font-black text-cyan-300">{glyph}</span>
            <p className="mt-4 text-lg font-bold">{title}</p><p className="text-sm text-slate-400">{sub}</p>
          </Link>
        ))}
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/session?mode=weak" className="card flex min-h-[72px] items-center gap-3 p-4 font-bold"><Icon name="target" className="h-6 w-6 text-rose-300" />Weak Areas</Link>
        <Link to="/progress" className="card flex min-h-[72px] items-center gap-3 p-4 font-bold"><Icon name="chart" className="h-6 w-6 text-emerald-300" />Progress</Link>
      </div>
      <footer className="pt-2 text-center text-xs text-slate-500">BA3 · Concept by Badri · Built with AI-assisted development</footer>
    </div>
  );
}
