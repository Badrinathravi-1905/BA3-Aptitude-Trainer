export const secs = (ms) => (ms ? (ms / 1000).toFixed(1) + "s" : "–");
export const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export const TOPICS = [
  { id: "alpha_fwd", label: "Alphabet Forward" }, { id: "alpha_rev", label: "Alphabet Reverse" },
  { id: "alpha_mix", label: "Alphabet Mixed" }, { id: "tab_2_10", label: "Tables 2–10" },
  { id: "tab_11_20", label: "Tables 11–20" }, { id: "tab_21_28", label: "Tables 21–28" },
  { id: "tab_2_28", label: "Tables 2–28" }, { id: "squares", label: "Squares 1–30" },
  { id: "cubes", label: "Cubes 1–20" },
];
export const TOPIC_LABEL = { alpha: "Alphabet", tables_2_10: "Tables", tables_11_20: "Tables", tables_21_28: "Tables", squares: "Squares", cubes: "Cubes" };
