import { createContext, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import type {
  Activity, CharacterLook, Cat, ExView, Listing, Notif, Sheet, Stage, Tab, Thread, ThreadRole, Villager,
} from "./types";
import { CATS, DIST, REPLIES, SEED_ITEMS, HOME_HOOD } from "./data";
import { charFor, cloneChar, randomChar } from "./character";
import { api, setToken } from "./api";

// When VITE_API_URL is set, the app talks to the live backend; otherwise it runs
// the in-memory demo (default) so the app works with no server.
const API = !!import.meta.env.VITE_API_URL;
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

interface State {
  stage: Stage; tab: Tab; exView: ExView; maxDist: number; query: string;
  hoodScope: "mine" | "nearby" | "all";
  filter: Cat | "all"; selectedPin: string | null; chatOpen: string | null;
  sheet: Sheet; toastMsg: string; toastKey: number;
  apiMode: boolean; meId: string | null;
  balance: number;
  player: { name: string; char: CharacterLook; neighborhood: string };
  draft: CharacterLook;
  items: Listing[]; village: Villager[]; threads: Thread[]; activity: Activity[];
  notifications: Notif[]; blocked: string[];
}

const firstName = (n: string) => n.split(/[ &]/)[0];
const DEFAULT_LOOK: CharacterLook = { species: 0, skin: 1, haircolor: 1, hair: 0, shirt: 1, acc: 0 };

function initialState(): State {
  return {
    stage: "auth", tab: "village", exView: "list", maxDist: DIST.default, query: "",
    hoodScope: "mine",
    filter: "all", selectedPin: null, chatOpen: null, sheet: null, toastMsg: "", toastKey: 0,
    apiMode: API, meId: null, balance: 12,
    player: { name: "Jordan", char: { ...DEFAULT_LOOK }, neighborhood: HOME_HOOD },
    draft: { ...DEFAULT_LOOK },
    items: SEED_ITEMS.slice(),
    village: [
      { name: "Theo", cat: "repair", char: charFor("Theo"), kind: "app", note: "Tuned up your bike and refused extra sprouts." },
      { name: "Mina", cat: "art", char: charFor("Mina"), kind: "app", note: "Gave you a fresh haircut last Tuesday." },
      { name: "Uncle Ray", cat: "repair", char: charFor("Uncle Ray"), kind: "off", note: "Fixes the whole family's cars. Not on Clover yet!" },
    ],
    threads: [
      { id: "seed-1", name: "Grace", cat: "garden", itemId: "8", role: "client", status: "arranging", msgs: [
        { from: "me", text: "Hi Grace! I'd love help starting a veggie bed. When works?" },
        { from: "them", text: "Yes! I'm free Saturday morning and I'll bring seedlings. 🌱" },
      ] },
    ],
    activity: [
      { ic: "💇", cat: "care", t: "Haircut from Mina", s: "Last Tuesday", amt: -4 },
      { ic: "💻", cat: "tech", t: "You taught a spreadsheet class to Theo", s: "Oct 11", amt: 5 },
      { ic: "🌻", cat: "garden", t: "Welcome gift — new neighbor bonus", s: "Joined Oct 1", amt: 5 },
    ],
    notifications: [
      { id: "n2", icon: "💬", title: "Grace replied", body: "Yes! I'm free Saturday morning and I'll bring seedlings.", read: false },
      { id: "n1", icon: "🌱", title: "Welcome to Clover", body: "You've got 12 sprouts to start. Say hi to a neighbor!", read: false },
    ],
    blocked: [],
  };
}

export interface Actions {
  setTab(t: Tab): void; setExView(v: ExView): void; setMaxDist(mi: number): void;
  setQuery(q: string): void; setFilter(f: Cat | "all"): void; selectPin(id: string | null): void;
  setHoodScope(scope: "mine" | "nearby" | "all"): void;
  signIn(guest: boolean): void;
  apiAuth(b: { mode: "login" | "register"; email: string; name: string; password: string }): void;
  verify(method: string): void;
  setDraft(l: CharacterLook): void; shuffleDraft(): void; finishCreate(name: string): void;
  openSheet(s: Sheet): void; closeSheet(): void;
  post(d: { type: Listing["type"]; cat: Cat; title: string; blurb: string; cost: Listing["cost"]; photo?: string; photoFile?: File }): void;
  addOffVillager(d: { name: string; cat: Cat; note: string; look: CharacterLook }): void;
  startThread(item: Listing, role: ThreadRole): void;
  openThread(id: string): void; closeThread(): void; sendMsg(threadId: string, text: string): void;
  reserve(item: Listing): void; completeTrade(threadId: string): void;
  rate(threadId: string, targetId: string, stars: number): void;
  block(item: Listing): void; report(item: Listing, reason: string): void;
  toast(msg: string): void; notify(icon: string, title: string, body: string): void;
  markNotifsRead(): void; enableNotifications(): void;
}

interface Store { state: State; actions: Actions; }
const Ctx = createContext<Store | null>(null);

// ---- server DTO -> frontend shape ----
function mapListing(d: any): Listing {
  const pos = d.mx != null ? { mx: d.mx, my: d.my } : { mx: 10 + (hash(d.id) % 80), my: 55 + ((hash(d.id) >> 5) % 30) };
  return { id: String(d.id), authorId: d.authorId, type: d.type, cat: d.cat, name: d.name, dist: d.dist ?? 0,
    rating: d.rating ?? 5, reviews: d.reviews ?? 0, title: d.title, blurb: d.blurb, cost: d.cost, unit: d.unit ?? "",
    neighborhood: d.neighborhood, photo: d.photo, ...pos };
}
function mapMsg(m: any, meId: string | null) {
  return { from: m.kind === "SYSTEM" ? "sys" : m.senderId === meId ? "me" : "them", text: m.text } as Thread["msgs"][number];
}
function mapThread(d: any, meId: string | null): Thread {
  const otherName = d.starter?.id === meId ? d.other?.name : d.starter?.name;
  return {
    id: String(d.id), name: otherName ?? d.name ?? "Neighbor",
    cat: String(d.listing?.category ?? "care").toLowerCase() as Cat,
    itemId: String(d.listingId ?? d.listing?.id ?? ""),
    role: String(d.role ?? "CLIENT").toLowerCase() as ThreadRole,
    status: String(d.status ?? "ARRANGING").toLowerCase() as Thread["status"],
    msgs: (d.messages ?? []).map((m: any) => mapMsg(m, meId)),
  };
}
function mapVillager(d: any): Villager {
  return { name: d.name, cat: String(d.category ?? "care").toLowerCase() as Cat, char: d.charLook, kind: d.kind === "OFF" ? "off" : "app", note: d.note ?? "" };
}
function mapNotif(d: any): Notif {
  return { id: String(d.id), icon: d.icon ?? "🔔", title: d.title, body: d.body, read: !!d.read };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const ref = useRef<State>();
  if (!ref.current) ref.current = initialState();
  const s = ref.current!;
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const actions = useMemo<Actions>(() => {
    const toast = (msg: string) => { s.toastMsg = msg; s.toastKey++; bump(); };
    const fail = (e: unknown) => toast(e instanceof Error ? e.message : "Something went wrong");
    const getThread = (id: string) => s.threads.find((t) => t.id === id);
    const getItem = (id: string) => s.items.find((i) => i.id === id);
    const addVillager = (name: string, cat: Cat, note: string, kind: "app" | "off") => {
      if (s.village.some((v) => v.name === name)) return;
      s.village.push({ name, cat, char: charFor(name + kind), kind, note });
    };
    const fireBrowser = (title: string, body: string) => {
      try { if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") new Notification(title, { body }); } catch { /* ignore */ }
    };
    const notify = (icon: string, title: string, body: string) => {
      s.notifications.unshift({ id: uid(), icon, title, body, read: false });
      fireBrowser(title, body); bump();
    };
    const autoReply = (threadId: string) => {
      window.setTimeout(() => {
        const t = getThread(threadId); if (!t) return;
        const text = REPLIES[Math.floor(Math.random() * REPLIES.length)];
        t.msgs.push({ from: "them", text });
        notify("💬", `New message from ${firstName(t.name)}`, text);
      }, 800);
    };

    // ---- API-mode loaders ----
    const bootstrap = async () => {
      const [{ user }, feed, th, vil, notifs] = await Promise.all([
        api.me(), api.feed({}), api.threads(), api.village(), api.notifications(),
      ]);
      const u = user as any;
      s.meId = u.id; s.balance = u.balance ?? 0;
      s.player = { name: u.name, char: (u.char as CharacterLook) ?? { ...DEFAULT_LOOK }, neighborhood: u.neighborhood ?? HOME_HOOD };
      s.items = (feed.listings as any[]).map(mapListing);
      s.threads = (th.threads as any[]).map((t) => mapThread(t, u.id));
      s.village = (vil.villagers as any[]).map(mapVillager);
      s.notifications = (notifs.notifications as any[]).map(mapNotif);
      s.stage = "app"; s.tab = "village"; bump();
    };
    const refreshFeed = async () => { const r = await api.feed({}); s.items = (r.listings as any[]).map(mapListing); bump(); };
    const refreshThreads = async () => { const r = await api.threads(); s.threads = (r.threads as any[]).map((t) => mapThread(t, s.meId)); bump(); };
    const refreshThread = async (id: string) => {
      const r = await api.thread(id); const mapped = mapThread(r.thread as any, s.meId);
      const i = s.threads.findIndex((t) => t.id === id);
      if (i >= 0) s.threads[i] = mapped; else s.threads.unshift(mapped);
      bump();
    };
    const refreshMe = async () => { const { user } = await api.me(); s.balance = (user as any).balance ?? s.balance; bump(); };
    const refreshVillage = async () => { const r = await api.village(); s.village = (r.villagers as any[]).map(mapVillager); bump(); };

    return {
      setTab(t) { s.tab = t; if (t !== "explore") s.selectedPin = null; if (t === "chats") s.chatOpen = null; bump(); },
      setExView(v) { s.exView = v; s.selectedPin = null; bump(); },
      setMaxDist(mi) { s.maxDist = mi; bump(); },
      setQuery(q) { s.query = q; bump(); },
      setHoodScope(scope) { s.hoodScope = scope; s.selectedPin = null; bump(); },
      setFilter(f) { s.filter = f; bump(); },
      selectPin(id) { s.selectedPin = id; bump(); },

      signIn(guest) {
        // Demo sign-in (also used for "explore as guest" in API mode).
        s.stage = guest || !API ? (guest ? "app" : "verify") : "verify";
        if (guest) { s.player.char = randomChar(); s.tab = "village"; toast("Exploring as a guest 🍀"); }
        bump();
      },
      apiAuth(b) {
        (async () => {
          try {
            if (b.mode === "register") {
              const r = await api.register({ email: b.email, name: b.name, password: b.password, char: s.player.char as any });
              setToken(r.token); s.meId = (r.user as any).id; s.player = { name: (r.user as any).name, char: s.player.char, neighborhood: (r.user as any).neighborhood ?? HOME_HOOD };
              s.stage = "verify"; bump();
            } else {
              const r = await api.login({ email: b.email, password: b.password });
              setToken(r.token); await bootstrap();
            }
          } catch (e) { fail(e); }
        })();
      },
      verify(method) {
        if (API) {
          (async () => { try { await api.verify(method); } catch (e) { fail(e); } s.stage = "create"; s.draft = cloneChar(s.player.char); bump(); })();
        } else { s.stage = "create"; s.draft = cloneChar(s.player.char); toast("You're verified ✓"); }
      },
      setDraft(l) { s.draft = l; bump(); },
      shuffleDraft() { s.draft = randomChar(); bump(); },
      finishCreate(name) {
        const look = cloneChar(s.draft); const nm = name.trim() || "You";
        if (API) {
          (async () => { try { await bootstrap(); } catch (e) { fail(e); } s.player = { name: nm, char: look, neighborhood: s.player.neighborhood }; s.stage = "app"; s.tab = "village"; bump(); })();
        } else { s.player = { name: nm, char: look, neighborhood: s.player.neighborhood }; s.stage = "app"; s.tab = "village"; toast("Welcome to Echo Park 🍀"); }
      },

      openSheet(sheet) { s.sheet = sheet; bump(); },
      closeSheet() { s.sheet = null; bump(); },

      post(d) {
        if (API) {
          (async () => {
            try {
              let photoUrl: string | undefined;
              if (d.photoFile) photoUrl = await api.uploadPhoto(d.photoFile);
              await api.createListing({
                type: d.type, category: d.cat, title: d.title, blurb: d.blurb,
                costType: d.type === "pact" ? "PACT" : "SPROUTS",
                cost: d.type === "pact" ? null : (typeof d.cost === "number" ? d.cost : 0),
                photoUrl,
              });
              await refreshFeed();
              s.filter = "all"; toast("Posted to the neighborhood! 🎉");
              s.tab = d.type === "pact" ? "pacts" : "explore"; if (d.type !== "pact") s.exView = "list"; bump();
            } catch (e) { fail(e); }
          })();
          return;
        }
        s.items.unshift({
          id: uid(), type: d.type, cat: d.cat, name: "You", dist: 0, mx: 48 + Math.random() * 8, my: 52 + Math.random() * 8,
          rating: 5, reviews: 0, title: d.title, blurb: d.blurb || "(No details yet)", cost: d.cost, unit: d.type === "offer" ? "hour" : "", photo: d.photo,
        });
        s.filter = "all"; toast("Posted to the neighborhood! 🎉");
        s.tab = d.type === "pact" ? "pacts" : "explore"; if (d.type !== "pact") s.exView = "list"; bump();
      },

      addOffVillager(d) {
        if (API) {
          (async () => { try { await api.addVillager({ name: d.name, category: d.cat, note: d.note, char: d.look as any }); await refreshVillage(); } catch (e) { fail(e); } s.sheet = null; toast(d.name + " joined your village 💛"); })();
          return;
        }
        s.village.push({ name: d.name, cat: d.cat, char: cloneChar(d.look), kind: "off", note: d.note || "Someone who helps you out." });
        s.sheet = null; toast(d.name + " joined your village 💛");
      },

      startThread(item, role) {
        if (API) {
          (async () => {
            try {
              s.sheet = null;
              const r = await api.startThread(item.id, role);
              await refreshThreads();
              s.chatOpen = String((r.thread as any).id); s.tab = "chats"; bump();
            } catch (e) { fail(e); }
          })();
          return;
        }
        const existing = s.threads.find((t) => t.itemId === item.id);
        s.sheet = null;
        if (existing) { s.chatOpen = existing.id; s.tab = "chats"; bump(); return; }
        const opener = role === "client" ? `Hi ${firstName(item.name)}! I'd love to take you up on "${item.title}". When works?`
          : role === "provider" ? `Hi ${firstName(item.name)}! I can help with "${item.title}". When's good?`
          : `Hi ${firstName(item.name)}! I'd love to join your pact "${item.title}".`;
        const t: Thread = { id: uid(), name: item.name, cat: item.cat, itemId: item.id, role, status: "arranging", msgs: [{ from: "me", text: opener }] };
        s.threads.unshift(t);
        if (role === "provider" || role === "joiner") addVillager(item.name, item.cat, role === "joiner" ? "Pact: " + item.title : "You helped: " + item.title, "app");
        s.chatOpen = t.id; s.tab = "chats"; bump();
        autoReply(t.id);
      },
      openThread(id) { s.chatOpen = id; s.tab = "chats"; bump(); if (API) refreshThread(id).catch(() => {}); },
      closeThread() { s.chatOpen = null; bump(); },
      sendMsg(threadId, text) {
        const t = getThread(threadId); if (!t || !text.trim()) return;
        t.msgs.push({ from: "me", text: text.trim() }); bump();
        if (API) api.sendMessage(threadId, text.trim()).catch(fail);
        else autoReply(threadId);
      },

      reserve(item) {
        if (API) {
          const threadId = s.chatOpen;
          (async () => {
            try { if (threadId) { await api.reserve(threadId); await refreshThread(threadId); } await refreshMe();
              s.sheet = null; toast(firstName(item.name) + " moved into your village! 🏡"); bump();
            } catch (e) { fail(e); }
          })();
          return;
        }
        const cost = typeof item.cost === "number" ? item.cost : 0;
        if (cost > s.balance) return;
        s.balance -= cost;
        if (cost > 0) s.activity.unshift({ ic: CATS[item.cat].e, cat: item.cat, t: `Reserved: ${item.title} · ${item.name}`, s: "Just now", amt: -cost });
        addVillager(item.name, item.cat, "You got: " + item.title, "app");
        const t = s.threads.find((th) => th.itemId === item.id);
        if (t) { t.status = "reserved"; t.msgs.push({ from: "sys", text: cost > 0 ? `🌱 You reserved ${cost} sprouts for ${firstName(item.name)}. Held until you both mark it done.` : "🔁 Barter agreed." }); }
        s.sheet = null; toast(firstName(item.name) + " moved into your village! 🏡"); bump();
      },
      completeTrade(threadId) {
        const t = getThread(threadId); if (!t) return;
        const item = getItem(t.itemId);
        if (API) {
          (async () => {
            try { await api.complete(threadId); await refreshThread(threadId); await refreshMe();
              if (t.role === "client" && item) s.sheet = { kind: "rating", targetId: item.id, threadId };
              else toast("Trade complete 🌱"); bump();
            } catch (e) { fail(e); }
          })();
          return;
        }
        if (t.status === "done") return;
        if (t.role === "provider") {
          const reward = item && typeof item.cost === "number" ? item.cost : 0; s.balance += reward;
          if (reward > 0 && item) s.activity.unshift({ ic: CATS[item.cat].e, cat: item.cat, t: `Earned: ${item.title} · ${item.name}`, s: "Just now", amt: reward });
          t.status = "done";
          t.msgs.push({ from: "sys", text: reward > 0 ? `✅ Complete! You earned ${reward} 🌱. ${firstName(t.name)} rated you ⭐` : "✅ Complete! Thanks for helping." });
          notify("🌱", "Trade complete", reward > 0 ? `You earned ${reward} sprouts from ${firstName(t.name)}.` : `Thanks for helping ${firstName(t.name)}.`);
          toast(reward > 0 ? `You earned ${reward} 🌱!` : "All done — thanks for helping 🙌"); bump();
        } else if (t.role === "joiner") {
          t.status = "done"; t.msgs.push({ from: "sys", text: `🤝 Pact on! ${firstName(t.name)} is counting on you weekly.` });
          notify("🤝", "Pact confirmed", `You joined ${firstName(t.name)}'s pact.`); toast("Pact confirmed 🤝"); bump();
        } else {
          t.status = "done"; t.msgs.push({ from: "sys", text: `✅ Trade complete! Sprouts released to ${firstName(t.name)}.` });
          if (item) s.sheet = { kind: "rating", targetId: item.id, threadId }; bump();
        }
      },
      rate(threadId, targetId, stars) {
        if (API) {
          (async () => { try { await api.rate(threadId, stars); } catch (e) { fail(e); } s.sheet = null; toast(`Thanks! You left ${stars} ⭐`); bump(); })();
          return;
        }
        const target = getItem(targetId);
        if (target) { target.reviews += 1; target.rating = Math.round((target.rating * 0.9 + stars * 0.1) * 10) / 10; }
        s.sheet = null; toast(`Thanks! You rated ${target ? firstName(target.name) : "them"} ${"⭐".repeat(stars)}`);
      },

      block(item) {
        if (API && item.authorId) {
          (async () => { try { await api.block(item.authorId!); await refreshFeed(); } catch (e) { fail(e); } s.sheet = null; toast(`You won't see posts from ${firstName(item.name)} anymore.`); })();
          return;
        }
        if (!s.blocked.includes(item.name)) s.blocked.push(item.name);
        s.sheet = null; toast(`You won't see posts from ${firstName(item.name)} anymore.`);
      },
      report(item, reason) {
        if (API && item.authorId) api.report({ targetId: item.authorId, listingId: item.id, reason }).catch(fail);
        s.sheet = null; toast(`Thanks — we'll review this report about ${firstName(item.name)}.`);
      },

      toast, notify,
      markNotifsRead() { s.notifications.forEach((n) => (n.read = true)); bump(); if (API) api.markRead().catch(() => {}); },
      enableNotifications() {
        try {
          if (typeof window !== "undefined" && "Notification" in window) {
            Notification.requestPermission().then((p) => toast(p === "granted" ? "Notifications on 🔔" : "Notifications stay off"));
          } else toast("This browser can't do notifications");
        } catch { toast("Couldn't enable notifications"); }
      },
    };
  }, [s]);

  const value: Store = { state: s, actions };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}

export { firstName };
