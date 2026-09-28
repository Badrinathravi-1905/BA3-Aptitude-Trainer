export default function Logo({ size = 40, className = "" }) {
  return (
    <div role="img" aria-label="BA3" style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-black tracking-tight text-ink shadow-glow ${className}`}>
      <span style={{ fontSize: size * 0.36 }}>BA3</span>
    </div>
  );
}
