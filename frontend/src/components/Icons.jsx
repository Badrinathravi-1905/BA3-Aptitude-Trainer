const P = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  play: "M8 5v14l11-7z", chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.5 7.5 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2l.4 2.6h4l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z", target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.4l3.5 2-1 1.7L11 13V7z",
  check: "M5 13l4 4L19 7", x: "M6 6l12 12M18 6L6 18", refresh: "M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5",
};
export default function Icon({ name, className = "h-6 w-6", stroke = true }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill={stroke && ["check", "x", "chart", "refresh"].includes(name) ? "none" : "currentColor"}
      stroke={["check", "x", "chart", "refresh"].includes(name) ? "currentColor" : "none"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={P[name]} />
    </svg>
  );
}
