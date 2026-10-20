import { useEffect, useState } from "react";
import { useStore, firstName } from "../store";
import type { Listing, Sheet, ThreadRole, CharacterLook, Cat, EventItem } from "../types";
import { CATS, CAT_KEYS } from "../data";
import { Character, randomChar, cloneChar } from "../character";
import { CharacterBuilder } from "./CharacterBuilder";
import { Avatar, RateBadge, PhotoBanner } from "./listing";

export function SheetHost() {
  const { state, actions } = useStore();
  const sheet = state.sheet;
  return (
    <>
      <div className={"scrim" + (sheet ? " show" : "")} onClick={actions.closeSheet} />
      <div className={"sheet" + (sheet ? " show" : "")} role="dialog" aria-modal="true">
        <div className="grab" />
        {sheet && <SheetBody sheet={sheet} />}
      </div>
    </>
  );
}

function SheetBody({ sheet }: { sheet: NonNullable<Sheet> }) {
  const { state } = useStore();
  switch (sheet.kind) {
    case "item": { const it = state.items.find((i) => i.id === sheet.id); return it ? <ItemSheet item={it} /> : null; }
    case "confirm": { const it = state.items.find((i) => i.id === sheet.id); return it ? <ConfirmSheet item={it} /> : null; }
    case "villager": { const v = state.village[sheet.index]; return v ? <VillagerSheet index={sheet.index} /> : null; }
    case "addVillager": return <AddVillagerSheet />;
    case "rating": { const it = state.items.find((i) => i.id === sheet.targetId); return it ? <RatingSheet item={it} threadId={sheet.threadId} /> : null; }
    case "report": { const it = state.items.find((i) => i.id === sheet.id); return it ? <ReportSheet item={it} /> : null; }
    case "notifications": return <NotificationsSheet />;
    case "gift": return <GiftSheet />;
    case "event": { const ev = state.events.find((e) => e.id === sheet.id); return ev ? <EventSheet ev={ev} /> : null; }
    case "createEvent": return <CreateEventSheet />;
  }
}

function ItemSheet({ item }: { item: Listing }) {
  const { actions } = useStore();
  const isMine = item.name === "You";
  const role: ThreadRole = item.type === "offer" ? "client" : item.type === "request" ? "provider" : "joiner";
  const actLabel = item.type === "offer" ? "💬 Message to arrange" : item.type === "request" ? "💬 Offer to help" : "💬 Ask to join";
  const dealLabel = item.cost === "barter" ? "Open to a trade" : item.cost === "pact" ? "Even swap — no sprouts" : item.type === "request" ? "You’d earn" : "Costs you";
  const dealVal = item.cost === "barter" ? "🔁" : item.cost === "pact" ? "♾️" : item.cost + " 🌱";
  const dist = item.dist ? (item.dist <= 1.2 ? item.dist + " mi · a short walk" : item.dist + " mi · a trek, but worth it") : "nearby";
  return (
    <>
      <PhotoBanner item={item} big />
      <div className="sh-head">
        <Avatar name={item.name} cat={item.cat} />
        <div>
          <h2>{item.title}</h2>
          <div className="sh-meta"><span>{item.name}</span>{item.neighborhood && <><span>·</span><span>🏘️ {item.neighborhood}</span></>}<span>·</span><span>{dist}</span><span>·</span><RateBadge item={item} /></div>
        </div>
      </div>
      <div className="blurb">{item.blurb}</div>
      {item.review && (
        <div className="review">
          <div style={{ fontSize: 22 }}>💬</div>
          <div>
            <div className="q">“{item.review}”</div>
            <div className="a">— {item.revBy} · ⭐ {item.rating.toFixed(1)} from {item.reviews} neighbors</div>
          </div>
        </div>
      )}
      <div className="deal"><span className="dl">{dealLabel}</span><span className="dp">{dealVal}</span></div>
      <div className="actions">
        {isMine ? (
          <button className="btn btn-ghost" onClick={actions.closeSheet}>This is your post · Close</button>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => actions.startThread(item, role)}>{actLabel}</button>
            <button className="btn btn-ghost" onClick={actions.closeSheet}>Maybe later</button>
            <button className="reportlink" onClick={() => actions.openSheet({ kind: "report", id: item.id })}>⚠︎ Report or block {firstName(item.name)}</button>
          </>
        )}
      </div>
    </>
  );
}

function ConfirmSheet({ item }: { item: Listing }) {
  const { state, actions } = useStore();
  const cost = typeof item.cost === "number" ? item.cost : 0;
  const after = state.balance - cost;
  const short = after < 0;
  return (
    <>
      <h2 style={{ margin: "2px 0 14px" }}>Confirm &amp; reserve</h2>
      <div className="sh-head" style={{ marginBottom: 14 }}>
        <Avatar name={item.name} cat={item.cat} />
        <div><h2 style={{ fontSize: 17 }}>{item.title}</h2>
          <div className="sh-meta"><span>{item.name}</span><span>·</span><RateBadge item={item} /></div></div>
      </div>
      <div className="escrow">
        <div className="ln"><span>Your sprouts now</span><span>{state.balance} 🌱</span></div>
        <div className="ln"><span>Reserved for {firstName(item.name)}</span><span>{cost ? "−" + cost + " 🌱" : "Barter"}</span></div>
        <div className="ln tot"><span>Balance after</span><span>{short ? state.balance : after} 🌱</span></div>
        {short && <div className="warn">Not enough sprouts — earn some by helping a neighbor first 🌱</div>}
      </div>
      <p style={{ color: "var(--muted)", fontSize: 12.5, textAlign: "center", margin: "0 4px 16px", lineHeight: 1.5 }}>
        Sprouts are held safely until you both mark it done. Nothing is final yet.
      </p>
      <div className="actions">
        <button className="btn btn-primary" disabled={short} onClick={() => actions.reserve(item)}>Confirm &amp; reserve{cost ? " " + cost + " 🌱" : ""}</button>
        <button className="btn btn-ghost" onClick={actions.closeSheet}>Back</button>
      </div>
    </>
  );
}

function VillagerSheet({ index }: { index: number }) {
  const { state, actions } = useStore();
  const v = state.village[index];
  return (
    <>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 120, height: 132, margin: "4px auto 2px" }}><Character look={v.char} /></div>
        <h2 style={{ textAlign: "center" }}>{v.name}</h2>
        <div className="sh-meta" style={{ justifyContent: "center" }}>
          {v.kind === "off" ? "💛 Added by you · not on Clover" : `${CATS[v.cat].e} ${CATS[v.cat].label} · a Clover neighbor`}
        </div>
      </div>
      <div className="blurb" style={{ marginTop: 14 }}>{v.note}</div>
      <div className="actions"><button className="btn btn-ghost" onClick={actions.closeSheet}>Close</button></div>
    </>
  );
}

function AddVillagerSheet() {
  const { actions } = useStore();
  const [look, setLook] = useState<CharacterLook>(() => randomChar());
  const [name, setName] = useState("");
  const [cat, setCat] = useState<Cat>("repair");
  const [note, setNote] = useState("");
  return (
    <>
      <h2>Add someone to your village 💛</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 14px" }}>
        For people who help you but aren’t on Clover — your car-fixing brother, your tutoring aunt. A private keepsake, just for you.
      </p>
      <div className="charprev"><Character look={look} /></div>
      <div style={{ textAlign: "center", margin: "10px 0 16px" }}>
        <button className="opt2" onClick={() => setLook(randomChar())}>🎲 Shuffle look</button>
      </div>
      <CharacterBuilder look={look} onChange={setLook} />
      <div className="field"><label>Their name</label>
        <input value={name} maxLength={24} placeholder="e.g. Uncle Ray" onChange={(e) => setName(e.target.value)} /></div>
      <div className="field"><label>What do they help with?</label>
        <select value={cat} onChange={(e) => setCat(e.target.value as Cat)}>
          {CAT_KEYS.map((k) => <option key={k} value={k}>{CATS[k].e} {CATS[k].label}</option>)}
        </select></div>
      <div className="field"><label>A note (optional)</label>
        <textarea value={note} placeholder="e.g. Fixes the whole family’s cars." onChange={(e) => setNote(e.target.value)} /></div>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => {
          if (!name.trim()) { actions.toast("Give them a name first 💛"); return; }
          actions.addOffVillager({ name: name.trim(), cat, note: note.trim(), look: cloneChar(look) });
        }}>Add to my village</button>
        <button className="btn btn-ghost" onClick={actions.closeSheet}>Cancel</button>
      </div>
    </>
  );
}

function RatingSheet({ item, threadId }: { item: Listing; threadId: string }) {
  const { actions } = useStore();
  const [stars, setStars] = useState(5);
  const [note, setNote] = useState("");
  const [share, setShare] = useState(true);
  const submit = () => {
    if (share && note.trim()) actions.addGratitude(item.name, item.cat, note.trim());
    actions.rate(threadId, item.id, stars);
  };
  return (
    <>
      <h2 style={{ textAlign: "center", margin: "2px 0 4px" }}>How was it with {firstName(item.name)}?</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", margin: "0 0 6px" }}>
        You can only rate neighbors you’ve actually traded with.
      </p>
      <div className="starpick">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= stars ? "on" : ""} onClick={() => setStars(n)}>⭐</button>)}
      </div>
      <div className="field"><label>Add a note (optional)</label>
        <textarea value={note} placeholder="What made it great? Anything others should know?" onChange={(e) => setNote(e.target.value)} /></div>
      <label className="sharerow">
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
        <span>💛 Share this as a public thank-you</span>
      </label>
      <div className="actions">
        <button className="btn btn-primary" onClick={submit}>Submit rating</button>
        <button className="btn btn-ghost" onClick={actions.closeSheet}>Skip</button>
      </div>
    </>
  );
}

function EventSheet({ ev }: { ev: EventItem }) {
  const { actions } = useStore();
  const full = ev.going >= ev.capacity && !ev.rsvped;
  return (
    <>
      <PhotoBanner item={{ photo: ev.photo, cat: ev.cat, title: ev.title } as Listing} big />
      <div className="sh-head">
        <Avatar name={ev.host} cat={ev.cat} />
        <div>
          <h2>{ev.title}</h2>
          <div className="sh-meta"><span>Hosted by {ev.host}</span>{ev.neighborhood && <><span>·</span><span>🏘️ {ev.neighborhood}</span></>}</div>
        </div>
      </div>
      <div className="evmeta">
        <div><b>🗓️ When</b><span>{ev.when}</span></div>
        <div><b>📍 Where</b><span>{ev.place}</span></div>
        <div><b>👥 Going</b><span>{ev.going} / {ev.capacity}</span></div>
      </div>
      <div className="blurb">{ev.blurb}</div>
      <div className="actions">
        <button className={"btn " + (ev.rsvped ? "btn-ghost" : "btn-primary")} disabled={full} onClick={() => actions.rsvp(ev.id)}>
          {ev.rsvped ? "✓ You're going — tap to cancel" : full ? "Event is full" : "🎉 RSVP — I'll be there"}
        </button>
        <button className="btn btn-ghost" onClick={actions.closeSheet}>Close</button>
      </div>
    </>
  );
}

function CreateEventSheet() {
  const { actions } = useStore();
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<Cat>("garden");
  const [when, setWhen] = useState("");
  const [place, setPlace] = useState("");
  const [capacity, setCapacity] = useState(12);
  const [blurb, setBlurb] = useState("");
  return (
    <>
      <h2>Host an event 🎉</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 14px" }}>
        A group get-together for the neighborhood — a seed swap, repair café, potluck, or cleanup.
      </p>
      <div className="field"><label>Title</label>
        <input value={title} maxLength={70} placeholder="e.g. Saturday block cleanup" onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label>Category</label>
        <select value={cat} onChange={(e) => setCat(e.target.value as Cat)}>
          {CAT_KEYS.map((k) => <option key={k} value={k}>{CATS[k].e} {CATS[k].label}</option>)}
        </select></div>
      <div className="field"><label>When</label>
        <input value={when} placeholder="e.g. Sat 10am" onChange={(e) => setWhen(e.target.value)} /></div>
      <div className="field"><label>Where</label>
        <input value={place} placeholder="e.g. Echo Park Lake lawn" onChange={(e) => setPlace(e.target.value)} /></div>
      <div className="field"><label>Capacity</label>
        <div className="steps">
          <button onClick={() => setCapacity(Math.max(2, capacity - 1))}>–</button>
          <div className="v">{capacity}</div>
          <button onClick={() => setCapacity(Math.min(100, capacity + 1))}>+</button>
        </div></div>
      <div className="field"><label>Details</label>
        <textarea value={blurb} placeholder="What to bring, what to expect." onChange={(e) => setBlurb(e.target.value)} /></div>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => {
          if (!title.trim() || !when.trim() || !place.trim()) { actions.toast("Add a title, when, and where"); return; }
          actions.createEvent({ title: title.trim(), cat, when: when.trim(), place: place.trim(), capacity, blurb: blurb.trim() });
        }}>Post event</button>
        <button className="btn btn-ghost" onClick={actions.closeSheet}>Cancel</button>
      </div>
    </>
  );
}

function GiftSheet() {
  const { state, actions } = useStore();
  const [amt, setAmt] = useState(Math.min(5, Math.max(1, state.balance)));
  return (
    <>
      <h2>Give to the community pot 🫙</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 16px" }}>
        Sprouts you don’t need keep the neighborhood moving. Neighbors who are low on sprouts can draw from the pot.
      </p>
      <div className="steps" style={{ justifyContent: "center", marginBottom: 18 }}>
        <button onClick={() => setAmt(Math.max(1, amt - 1))}>–</button>
        <div className="v">{amt} 🌱</div>
        <button onClick={() => setAmt(Math.min(state.balance, amt + 1))}>+</button>
      </div>
      <div className="actions">
        <button className="btn btn-primary" disabled={state.balance < 1} onClick={() => actions.gift(amt)}>Give {amt} 🌱</button>
        <button className="btn btn-ghost" onClick={actions.closeSheet}>Cancel</button>
      </div>
    </>
  );
}

const REPORT_REASONS = [
  "Spam or a scam",
  "Inappropriate content",
  "Safety concern",
  "Didn’t show up / unreliable",
  "Something else",
];

function ReportSheet({ item }: { item: Listing }) {
  const { actions } = useStore();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const who = firstName(item.name);
  return (
    <>
      <h2>Report or block {who}</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 14px" }}>
        Reports are private and help keep the neighborhood safe. Blocking hides {who}’s posts from you.
      </p>
      <div className="field"><label>What’s going on?</label>
        <div className="reasons">
          {REPORT_REASONS.map((r) => (
            <button key={r} className="opt2" aria-pressed={reason === r} onClick={() => setReason(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div className="field"><label>Add details (optional)</label>
        <textarea placeholder="Anything that helps us understand." /></div>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => actions.report(item, reason)}>Submit report</button>
        <button className="btn btn-ghost" onClick={() => actions.block(item)}>🚫 Block {who}</button>
        <button className="btn btn-ghost" onClick={actions.closeSheet}>Cancel</button>
      </div>
    </>
  );
}

function NotificationsSheet() {
  const { state, actions } = useStore();
  useEffect(() => { actions.markNotifsRead(); /* eslint-disable-next-line */ }, []);
  const canEnable = typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted";
  return (
    <>
      <h2>Notifications 🔔</h2>
      {canEnable && (
        <button className="btn btn-teal" style={{ margin: "4px 0 14px" }} onClick={actions.enableNotifications}>
          Turn on browser notifications
        </button>
      )}
      {state.notifications.length ? (
        <div>
          {state.notifications.map((n) => (
            <div className="notif" key={n.id}>
              <div className="nic">{n.icon}</div>
              <div className="nt"><b>{n.title}</b><span>{n.body}</span></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty"><span className="e">🔕</span>No notifications yet.</div>
      )}
      <div className="actions" style={{ marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={actions.closeSheet}>Close</button>
      </div>
    </>
  );
}
