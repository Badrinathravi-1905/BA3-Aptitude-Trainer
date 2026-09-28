import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icons";

const ITEMS = [["/", "Home", "home"], ["/practice", "Practice", "play"], ["/progress", "Progress", "chart"], ["/settings", "Settings", "cog"]];

export default function BottomNav() {
  if (useLocation().pathname.startsWith("/session")) return null;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink/85 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="mx-auto flex max-w-xl">
        {ITEMS.map(([to, label, icon]) => (
          <li key={to} className="flex-1">
            <NavLink to={to} end={to === "/"} className={({ isActive }) => `flex min-h-[64px] flex-col items-center justify-center gap-1 text-xs font-semibold ${isActive ? "text-cyan-300" : "text-slate-400"}`}>
              <Icon name={icon} className="h-6 w-6" />{label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
