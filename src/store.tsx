import { createContext, useContext, useMemo, useReducer, useRef, type ReactNode } from "react";
import type {
  Activity, CharacterLook, Cat, ExView, Listing, Notif, Sheet, Stage, Tab, Thread, ThreadRole, Villager,
} from "./types";
import { CATS, DIST, REPLIES, SEED_ITEMS } from "./data";
import { charFor, cloneChar, randomChar } from "./character";

interface State {
  stage: Stage;
  tab: Tab;
  exView: ExView;
  maxDist: number;
  filter: Cat | "all";
  selectedPin: number | null;
  chatOpen: number | null;
  sheet: Sheet;
  toastMsg: string;
  toastKey: number;
  balance: number;
  player: { name: string; char: CharacterLook };
  draft: CharacterLook;
  items: Listing[];
  village: Villager[];
  threads: Thread[];
  activity: Activity[];
  notifications: Notif[];
  blocked: string[];
}

const firstName = (n: string) => n.split(/[ &]/)[0];

function initialState(): State {
  return {
    stage: "auth",
    tab: "village",
    exView: "list",
    maxDist: DIST.default,
    filter: "all",
    selectedPin: null,
    chatOpen: null,
    sheet: null,
    toastMsg: "",
    toastKey: 0,
    balance: 12,
    player: { name: "Jordan", char: { species: 0, skin: 1, haircolor: 1, hair: 0, shirt: 1, acc: 0 } },
    draft: { species: 0, skin: 1, haircolor: 1, hair: 0, shirt: 1, acc: 0 },
    items: SEED_ITEMS.slice(),
    village: [
      { name: "Theo", cat: "repair", char: charFor("Theo"), kind: "app", note: "Tuned up your bike and refused extra sprouts." },
      { name: "Mina", cat: "art", char: charFor("Mina"), kind: "app", note: "Gave you a fresh haircut last Tuesday." },
      { name: "Uncle Ray", cat: "repair", char: charFor("Uncle Ray"), kind: "off", note: "Fixes the whole family's cars. Not on Clover yet!" },
    ],
    threads: [
      {
        id: 1, name: "Grace", cat: "garden", itemId: 8, role: "client", status: "arranging",
        msgs: [
          { from: "me", text: "Hi Grace! I'd love help starting a veggie bed. When works?" },
          { from: "them", text: "Yes! I'm free Saturday morning and I'll bring seedlings. 🌱" },
        ],
      },
    ],
    activity: [
      { ic: "💇", cat: "care", t: "Haircut from Mina", s: "Last Tuesday", amt: -4 },
      { ic: "💻", cat: "tech", t: "You taught a spreadsheet class to Theo", s: "Oct 11", amt: 5 },
      { ic: "🌻", cat: "garden", t: "Welcome gift — new neighbor bonus", s: "Joined Oct 1", amt: 5 },
    ],
    notifications: [
      { id: 2, icon: "💬", title: "Grace replied", body: "Yes! I'm free Saturday morning and I'll bring seedlings.", read: false },
      { id: 1, icon: "🌱", title: "Welcome to Clover", body: "You've got 12 sprouts to start. Say hi to a neighbor!", read: false },
    ],
    blocked: [],
  };
}

export interface Actions {
  setTab(tab: Tab): void;
  setExView(v: ExView): void;
  setMaxDist(mi: number): void;
  setFilter(f: Cat | "all"): void;
  selectPin(id: number | null): void;
  signIn(guest: boolean): void;
  verify(): void;
  setDraft(look: CharacterLook): void;
  shuffleDraft(): void;
  finishCreate(name: string): void;
  openSheet(sheet: Sheet): void;
  closeSheet(): void;
  post(data: { type: Listing["type"]; cat: Cat; title: string; blurb: string; cost: Listing["cost"]; photo?: string }): void;
  addOffVillager(data: { name: string; cat: Cat; note: string; look: CharacterLook }): void;
  startThread(item: Listing, role: ThreadRole): void;
  openThread(id: number): void;
  closeThread(): void;
  sendMsg(threadId: number, text: string): void;
  reserve(item: Listing): void;
  completeTrade(threadId: number): void;
  rate(targetId: number, stars: number): void;
  toast(msg: string): void;
  notify(icon: string, title: string, body: string): void;
  markNotifsRead(): void;
  enableNotifications(): void;
  block(name: string): void;
  report(name: string): void;
}

interface Store { state: State; actions: Actions; }
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const ref = useRef<State>();
  if (!ref.current) ref.current = initialState();
  const s = ref.current!;
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const actions = useMemo<Actions>(() => {
    const toast = (msg: string) => { s.toastMsg = msg; s.toastKey++; bump(); };
    const getThread = (id: number) => s.threads.find((t) => t.id === id);
    const getItem = (id: number) => s.items.find((i) => i.id === id);
    const addVillager = (name: string, cat: Cat, note: string, kind: "app" | "off") => {
      if (s.village.some((v) => v.name === name)) return false;
      s.village.push({ name, cat, char: charFor(name + kind), kind, note });
      return true;
    };
    const fireBrowser = (title: string, body: string) => {
      try {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: undefined });
        }
      } catch { /* ignore */ }
    };
    const notify = (icon: string, title: string, body: string) => {
      s.notifications.unshift({ id: Date.now() + Math.random(), icon, title, body, read: false });
      fireBrowser(title, body);
      bump();
    };
    const autoReply = (threadId: number) => {
      window.setTimeout(() => {
        const t = getThread(threadId);
        if (!t) return;
        const text = REPLIES[Math.floor(Math.random() * REPLIES.length)];
        t.msgs.push({ from: "them", text });
        notify("💬", `New message from ${firstName(t.name)}`, text);
      }, 800);
    };

    return {
      setTab(tab) { s.tab = tab; if (tab !== "explore") s.selectedPin = null; if (tab === "chats") s.chatOpen = null; bump(); },
      setExView(v) { s.exView = v; s.selectedPin = null; bump(); },
      setMaxDist(mi) { s.maxDist = mi; bump(); },
      setFilter(f) { s.filter = f; bump(); },
      selectPin(id) { s.selectedPin = id; bump(); },
      signIn(guest) {
        if (guest) { s.stage = "app"; s.player.char = randomChar(); s.tab = "village"; toast("Exploring as a guest 🍀"); return; }
        s.stage = "verify"; bump();
      },
      verify() { s.stage = "create"; s.draft = cloneChar(s.player.char); toast("You're verified ✓"); },
      setDraft(look) { s.draft = look; bump(); },
      shuffleDraft() { s.draft = randomChar(); bump(); },
      finishCreate(name) {
        s.player.name = name.trim() || "You";
        s.player.char = cloneChar(s.draft);
        s.stage = "app"; s.tab = "village";
        toast("Welcome to Echo Park 🍀");
      },
      openSheet(sheet) { s.sheet = sheet; bump(); },
      closeSheet() { s.sheet = null; bump(); },
      post(data) {
        s.items.unshift({
          id: Date.now(), type: data.type, cat: data.cat, name: "You", dist: 0,
          mx: 48 + Math.random() * 8, my: 52 + Math.random() * 8, rating: 5.0, reviews: 0,
          title: data.title, blurb: data.blurb || "(No details yet)", cost: data.cost,
          unit: data.type === "offer" ? "hour" : "", photo: data.photo,
        });
        s.filter = "all";
        toast("Posted to the neighborhood! 🎉");
        s.tab = data.type === "pact" ? "pacts" : "explore";
        if (data.type !== "pact") s.exView = "list";
        bump();
      },
      addOffVillager(data) {
        s.village.push({ name: data.name, cat: data.cat, char: cloneChar(data.look), kind: "off", note: data.note || "Someone who helps you out." });
        s.sheet = null;
        toast(data.name + " joined your village 💛");
      },
      startThread(item, role) {
        const existing = s.threads.find((t) => t.itemId === item.id);
        s.sheet = null;
        if (existing) { s.chatOpen = existing.id; s.tab = "chats"; bump(); return; }
        const opener =
          role === "client" ? `Hi ${firstName(item.name)}! I'd love to take you up on “${item.title}”. When works?` :
          role === "provider" ? `Hi ${firstName(item.name)}! I can help with “${item.title}”. When's good?` :
          `Hi ${firstName(item.name)}! I'd love to join your pact “${item.title}”.`;
        const t: Thread = { id: Date.now(), name: item.name, cat: item.cat, itemId: item.id, role, status: "arranging", msgs: [{ from: "me", text: opener }] };
        s.threads.unshift(t);
        if (role === "provider" || role === "joiner")
          addVillager(item.name, item.cat, role === "joiner" ? "Pact: " + item.title : "You helped: " + item.title, "app");
        s.chatOpen = t.id; s.tab = "chats"; bump();
        autoReply(t.id);
      },
      openThread(id) { s.chatOpen = id; s.tab = "chats"; bump(); },
      closeThread() { s.chatOpen = null; bump(); },
      sendMsg(threadId, text) {
        const t = getThread(threadId); if (!t || !text.trim()) return;
        t.msgs.push({ from: "me", text: text.trim() }); bump();
        autoReply(threadId);
      },
      reserve(item) {
        const cost = typeof item.cost === "number" ? item.cost : 0;
        if (cost > s.balance) return;
        s.balance -= cost;
        if (cost > 0) s.activity.unshift({ ic: CATS[item.cat].e, cat: item.cat, t: `Reserved: ${item.title} · ${item.name}`, s: "Just now", amt: -cost });
        addVillager(item.name, item.cat, "You got: " + item.title, "app");
        const t = s.threads.find((th) => th.itemId === item.id);
        if (t) { t.status = "reserved"; t.msgs.push({ from: "sys", text: cost > 0 ? `🌱 You reserved ${cost} sprouts for ${firstName(item.name)}. Held until you both mark it done.` : "🔁 Barter agreed. Mark it complete when you've swapped." }); }
        s.sheet = null;
        toast(firstName(item.name) + " moved into your village! 🏡");
        bump();
      },
      completeTrade(threadId) {
        const t = getThread(threadId); if (!t) return;
        const item = getItem(t.itemId);
        if (t.role === "provider") {
          const reward = item && typeof item.cost === "number" ? item.cost : 0;
          s.balance += reward;
          if (reward > 0 && item) s.activity.unshift({ ic: CATS[item.cat].e, cat: item.cat, t: `Earned: ${item.title} · ${item.name}`, s: "Just now", amt: reward });
          t.status = "done";
          t.msgs.push({ from: "sys", text: reward > 0 ? `✅ Complete! You earned ${reward} 🌱. ${firstName(t.name)} rated you ⭐` : "✅ Complete! Thanks for helping." });
          notify("🌱", "Trade complete", reward > 0 ? `You earned ${reward} sprouts from ${firstName(t.name)}.` : `Thanks for helping ${firstName(t.name)}.`);
          toast(reward > 0 ? `You earned ${reward} 🌱!` : "All done — thanks for helping 🙌");
          bump();
        } else if (t.role === "joiner") {
          t.status = "done";
          t.msgs.push({ from: "sys", text: `🤝 Pact on! ${firstName(t.name)} is counting on you weekly.` });
          notify("🤝", "Pact confirmed", `You joined ${firstName(t.name)}'s pact.`);
          toast("Pact confirmed 🤝"); bump();
        } else {
          t.status = "done";
          t.msgs.push({ from: "sys", text: `✅ Trade complete! Sprouts released to ${firstName(t.name)}.` });
          if (item) s.sheet = { kind: "rating", targetId: item.id, threadId };
          bump();
        }
      },
      rate(targetId, stars) {
        const target = getItem(targetId);
        if (target) { target.reviews += 1; target.rating = Math.round((target.rating * 0.9 + stars * 0.1) * 10) / 10; }
        s.sheet = null;
        toast(`Thanks! You rated ${target ? firstName(target.name) : "them"} ${"⭐".repeat(stars)}`);
      },
      toast,
      notify,
      markNotifsRead() { s.notifications.forEach((n) => (n.read = true)); bump(); },
      enableNotifications() {
        try {
          if (typeof window !== "undefined" && "Notification" in window) {
            Notification.requestPermission().then((p) => toast(p === "granted" ? "Notifications on 🔔" : "Notifications stay off"));
          } else { toast("This browser can't do notifications"); }
        } catch { toast("Couldn't enable notifications"); }
      },
      block(name) {
        if (!s.blocked.includes(name)) s.blocked.push(name);
        s.sheet = null;
        toast(`You won't see posts from ${firstName(name)} anymore.`);
      },
      report(name) {
        s.sheet = null;
        toast(`Thanks — we'll review this report about ${firstName(name)}.`);
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
