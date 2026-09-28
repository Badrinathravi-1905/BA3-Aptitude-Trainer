import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import Session from "./pages/Session";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";

export default function App() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return (
    <>
      {!online && <div role="status" className="bg-amber-400 px-4 py-2 text-center text-sm font-bold text-ink">You're offline. Practice and progress syncing need a connection.</div>}
      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-5" style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}>
        <Routes>
          <Route path="/" element={<Home />} /><Route path="/practice" element={<Practice />} />
          <Route path="/session" element={<Session />} /><Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} /><Route path="*" element={<Home />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  );
}
