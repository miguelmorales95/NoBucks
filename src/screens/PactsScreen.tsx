import { useState } from "react";
import { useStore } from "../store";
import { EventCard, Avatar, PhotoBanner } from "../components/listing";
import type { Listing } from "../types";

function PactCard({ p, onOpen }: { p: Listing; onOpen: (p: Listing) => void }) {
  return (
    <article className="card" onClick={() => onOpen(p)}>
      <PhotoBanner item={p} />
      <div className="row">
        <Avatar name={p.name} cat={p.cat} />
        <div className="body">
          <div className="meta">
            <span>{p.name}</span><span className="dot" />
            {p.neighborhood && <><span>🏘️ {p.neighborhood}</span><span className="dot" /></>}
            <span>👥 {p.members?.length ?? 2}</span>
            {p.locations && p.locations.length > 0 && <><span className="dot" /><span>📍 {p.locations.length}</span></>}
          </div>
          <h3>{p.title}</h3>
          <p>{p.blurb}</p>
        </div>
      </div>
      <div className="foot">
        <span className="tag pact">Pact</span>
        {p.open && <span className="price">🙌 <small>open to join</small></span>}
      </div>
    </article>
  );
}

export function PactsScreen() {
  const { state, actions } = useStore();
  const [q, setQ] = useState("");
  const view = state.gatherView;
  const query = q.trim().toLowerCase();
  const pacts = state.items.filter(
    (i) => i.type === "pact" && !state.blocked.includes(i.name)
      && (!query || `${i.title} ${i.blurb} ${i.name} ${(i.members ?? []).join(" ")}`.toLowerCase().includes(query))
  );

  return (
    <>
      <div className="screen-title">Gather 🎉</div>
      <div className="screen-sub">Standing swaps, group pacts, and get-togethers in your neighborhood.</div>
      <div className="seg">
        <button aria-pressed={view === "pacts"} onClick={() => actions.setGatherView("pacts")}>🤝 Pacts</button>
        <button aria-pressed={view === "events"} onClick={() => actions.setGatherView("events")}>🎉 Events</button>
      </div>

      {view === "pacts" ? (
        <>
          <div className="field" style={{ marginBottom: 12 }}>
            <input value={q} placeholder="Search pacts — a dinner club, tool share, carpool…" onChange={(e) => setQ(e.target.value)} />
          </div>
          {pacts.length ? (
            <div className="feed">
              {pacts.map((p) => <PactCard key={p.id} p={p} onOpen={(i) => actions.openSheet({ kind: "item", id: i.id })} />)}
            </div>
          ) : (
            <div className="empty"><span className="e">🍃</span>{query ? <>No pacts match “{q}”.</> : <>No pacts yet — post one from the + tab.</>}</div>
          )}
        </>
      ) : (
        <>
          <button className="btn btn-primary" style={{ marginBottom: 14 }} onClick={() => actions.openSheet({ kind: "createEvent" })}>🎉 Host an event</button>
          {state.events.length ? (
            <div className="feed">
              {state.events.map((ev) => <EventCard key={ev.id} ev={ev} onOpen={(e) => actions.openSheet({ kind: "event", id: e.id })} />)}
            </div>
          ) : (
            <div className="empty"><span className="e">🎉</span>No events yet — host the first one!</div>
          )}
        </>
      )}
    </>
  );
}
