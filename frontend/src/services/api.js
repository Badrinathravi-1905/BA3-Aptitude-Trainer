const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const KEY = "ba3_uid";

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function getUserId() {
  let id = localStorage.getItem(KEY);
  if (!id) { id = uuid(); localStorage.setItem(KEY, id); }
  return id;
}
export function resetUserId() { localStorage.removeItem(KEY); }

export class ApiError extends Error {}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "X-User-Id": getUserId() },
    });
  } catch {
    throw new ApiError("Unable to connect to the practice server.");
  }
  if (!res.ok) throw new ApiError(res.status >= 500 ? "The server hit a problem. Please retry." : "That request could not be completed.");
  return res.json();
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body: JSON.stringify(body ?? {}) }),
};
