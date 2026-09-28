import { getUserId, resetUserId } from "../services/api";
import Logo from "../components/Logo";

export default function Settings() {
  const reset = () => {
    if (window.confirm("Start fresh on this device? Your current progress stays on the server but becomes unreachable from this browser.")) { resetUserId(); window.location.href = "/"; }
  };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight">Settings</h1>
      <section className="card space-y-2 p-5"><p className="label">Your device ID</p>
        <p className="break-all font-mono text-sm text-slate-300">{getUserId()}</p>
        <p className="text-sm text-slate-400">Progress is tied to this browser. No account or password needed.</p></section>
      <button onClick={reset} className="btn-ghost w-full !text-rose-300">Reset this device</button>
      <section className="card flex items-center gap-4 p-5"><Logo size={48} />
        <p className="text-sm text-slate-400">BA3 Aptitude Trainer v1.0<br />Concept, requirements and product direction by Badri (BA3). Built using AI-assisted development.</p></section>
    </div>
  );
}
