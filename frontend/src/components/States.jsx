import Icon from "./Icons";

export const Loading = ({ text = "Loading…" }) => (
  <div role="status" className="grid place-items-center gap-3 py-20 text-slate-400">
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300" />{text}
  </div>
);
export const ErrorState = ({ message, onRetry }) => (
  <div role="alert" className="card mx-auto my-10 grid max-w-sm place-items-center gap-4 p-8 text-center">
    <p className="text-lg font-semibold">{message}</p>
    <p className="text-sm text-slate-400">Practice and progress need a connection to sync.</p>
    <button onClick={onRetry} className="btn-primary w-full"><Icon name="refresh" className="h-5 w-5" />Retry</button>
  </div>
);
