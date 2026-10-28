// Typed client for the NoBucks API (see /server). The app currently runs on the
// in-memory store in src/store.tsx; wiring it to a live backend means replacing
// the store's action bodies with these calls. Nothing here runs until VITE_API_URL
// points at a running server.

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "nobucks.token";

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
  register: (b: { email: string; name: string; password: string; adult: true; joinCode?: string; char?: Record<string, number> }) =>
    request<{ token: string; user: unknown }>("/auth/register", { method: "POST", body: JSON.stringify(b) }),
  login: (b: { email: string; password: string }) =>
    request<{ token: string; user: unknown }>("/auth/login", { method: "POST", body: JSON.stringify(b) }),
  me: () => request<{ user: unknown }>("/auth/me"),
  forgot: (email: string) => request<{ ok: true }>("/auth/forgot", { method: "POST", body: JSON.stringify({ email }) }),
  reset: (b: { email: string; code: string; password: string }) =>
    request<{ token: string; user: unknown }>("/auth/reset", { method: "POST", body: JSON.stringify(b) }),
  joinNeighborhood: (code: string) => request<{ user: unknown }>("/auth/join", { method: "POST", body: JSON.stringify({ code }) }),
  joinCodes: () => request<{ codes: { code: string; expiresAt: string; uses: number; maxUses: number }[] }>("/admin/join-codes"),
  createJoinCode: (days = 30) => request<{ code: string; expiresAt: string }>("/admin/join-codes", { method: "POST", body: JSON.stringify({ days }) }),
  logoutAll: () => request<{ ok: true }>("/auth/logout-all", { method: "POST" }),
  exportData: () => request<unknown>("/auth/me/export"),
  deleteAccount: (password: string) => request<{ ok: true }>("/auth/me", { method: "DELETE", body: JSON.stringify({ password }) }),
  updateMe: (b: { char?: Record<string, number>; villageTheme?: string; wardrobe?: string[] }) =>
    request<{ user: unknown }>("/me/update", { method: "POST", body: JSON.stringify(b) }),

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
  // Photos are redrawn before upload: that drops hidden details such as where a phone photo was
  // taken (EXIF), and keeps them a sensible size.
  async uploadPhoto(file: File): Promise<string> {
    const clean = await stripPhoto(file);
    const { uploadUrl, fileUrl } = await this.presign(clean.type);
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": clean.type }, body: clean });
    if (!res.ok) throw new Error("The photo didn't upload. Please try again.");
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

  // economy: community pot
  pot: () => request<{ balance: number }>("/wallet/pot"),
  gift: (amount: number) => request<{ ok: true }>("/wallet/gift", { method: "POST", body: JSON.stringify({ amount }) }),

  // gratitudes
  gratitudes: () => request<{ gratitudes: unknown[] }>("/gratitudes"),
  addGratitude: (b: { toName: string; category: string; text: string }) =>
    request<{ gratitude: unknown }>("/gratitudes", { method: "POST", body: JSON.stringify(b) }),

  // events
  events: () => request<{ events: unknown[] }>("/events"),
  createEvent: (b: { title: string; category: string; when: string; place: string; capacity: number; blurb: string }) =>
    request<{ event: unknown }>("/events", { method: "POST", body: JSON.stringify(b) }),
  rsvp: (id: string) => request<{ ok: true; going: number; rsvped: boolean }>(`/events/${id}/rsvp`, { method: "POST" }),

  // admin / community-leader tools
  adminOverview: () => request<{ neighborhood?: string; members: number; unverified?: number; listings: number; events: number; openReports: number; pot: number }>("/admin/overview"),
  verifyByEmail: (email: string, method: "in-person" | "known-neighbor" | "vouched") =>
    request<{ ok: true; name: string }>("/admin/members/verify-by-email", { method: "POST", body: JSON.stringify({ email, method }) }),
  adminReports: () => request<{ reports: any[] }>("/admin/reports"),
  resolveReport: (id: string, status: "REVIEWED" | "ACTIONED") =>
    request<{ ok: true }>(`/admin/reports/${id}/resolve`, { method: "POST", body: JSON.stringify({ status }) }),

  // notifications
  notifications: () => request<{ notifications: unknown[] }>("/notifications"),
  markRead: () => request<{ ok: true }>("/notifications/read", { method: "POST" }),
  registerDevice: (token: string, platform: "ios" | "android" | "web") =>
    request<{ device: unknown }>("/notifications/devices", { method: "POST", body: JSON.stringify({ token, platform }) }),
};

/** Redraws a photo on a canvas (at most 1600 px on its long side) and saves it as JPEG, which
 *  leaves out its EXIF data: location, camera and time. */
async function stripPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that photo"))), "image/jpeg", 0.86));
}
