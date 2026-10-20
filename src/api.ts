// Typed client for the Clover API (see /server). The app currently runs on the
// in-memory store in src/store.tsx; wiring it to a live backend means replacing
// the store's action bodies with these calls. Nothing here runs until VITE_API_URL
// points at a running server.

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "clover.token";

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t: string | null) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error((msg as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // auth
  register: (b: { email: string; name: string; password: string; char?: Record<string, number> }) =>
    request<{ token: string; user: unknown }>("/auth/register", { method: "POST", body: JSON.stringify(b) }),
  login: (b: { email: string; password: string }) =>
    request<{ token: string; user: unknown }>("/auth/login", { method: "POST", body: JSON.stringify(b) }),
  me: () => request<{ user: unknown }>("/auth/me"),
  verify: (method: string) => request<{ user: unknown }>("/auth/verify", { method: "POST", body: JSON.stringify({ method }) }),

  // listings
  feed: (q: { type?: string; category?: string; lat?: number; lng?: number; maxDist?: number }) => {
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => v != null && p.set(k, String(v)));
    return request<{ listings: unknown[] }>(`/listings?${p.toString()}`);
  },
  createListing: (b: Record<string, unknown>) =>
    request<{ listing: unknown }>("/listings", { method: "POST", body: JSON.stringify(b) }),

  // photo upload (two steps: presign, then PUT the file to S3)
  presign: (contentType: string) =>
    request<{ uploadUrl: string; fileUrl: string }>("/uploads/presign", { method: "POST", body: JSON.stringify({ contentType }) }),
  async uploadPhoto(file: File): Promise<string> {
    const { uploadUrl, fileUrl } = await this.presign(file.type);
    await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    return fileUrl;
  },

  // threads / trades
  threads: () => request<{ threads: unknown[] }>("/threads"),
  thread: (id: string) => request<{ thread: unknown }>(`/threads/${id}`),
  startThread: (listingId: string, role: "client" | "provider" | "joiner") =>
    request<{ thread: unknown }>("/threads", { method: "POST", body: JSON.stringify({ listingId, role }) }),
  sendMessage: (id: string, text: string) =>
    request<{ message: unknown }>(`/threads/${id}/messages`, { method: "POST", body: JSON.stringify({ text }) }),
  reserve: (id: string) => request<{ ok: true }>(`/threads/${id}/reserve`, { method: "POST" }),
  complete: (id: string) => request<{ ok: true }>(`/threads/${id}/complete`, { method: "POST" }),
  rate: (id: string, stars: number, note = "") =>
    request<{ ok: true }>(`/threads/${id}/rate`, { method: "POST", body: JSON.stringify({ stars, note }) }),

  // village
  village: () => request<{ villagers: unknown[] }>("/village"),
  addVillager: (b: { name: string; category: string; note: string; char: Record<string, number> }) =>
    request<{ villager: unknown }>("/village", { method: "POST", body: JSON.stringify(b) }),

  // moderation
  report: (b: { targetId: string; listingId?: string; reason: string; details?: string }) =>
    request<{ ok: true }>("/moderation/reports", { method: "POST", body: JSON.stringify(b) }),
  block: (blockedId: string) => request<{ ok: true }>("/moderation/blocks", { method: "POST", body: JSON.stringify({ blockedId }) }),
  blocks: () => request<{ blockedIds: string[] }>("/moderation/blocks"),

  // notifications
  notifications: () => request<{ notifications: unknown[] }>("/notifications"),
  markRead: () => request<{ ok: true }>("/notifications/read", { method: "POST" }),
  registerDevice: (token: string, platform: "ios" | "android" | "web") =>
    request<{ device: unknown }>("/notifications/devices", { method: "POST", body: JSON.stringify({ token, platform }) }),
};
