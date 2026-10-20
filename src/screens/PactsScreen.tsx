import { useStore } from "../store";
import { ListingCard, EventCard } from "../components/listing";

export function PactsScreen() {
  const { state, actions } = useStore();
  const pacts = state.items.filter(
    (i) => i.type === "pact" && (state.filter === "all" || i.cat === state.filter) && !state.blocked.includes(i.name)
  );
  const view = state.gatherView;

  return (
    <>
      <div className="screen-title">Gather 🎉</div>
      <div className="screen-sub">Standing swaps and group get-togethers in your neighborhood.</div>
      <div className="seg">
        <button aria-pressed={view === "pacts"} onClick={() => actions.setGatherView("pacts")}>🤝 Pacts</button>
        <button aria-pressed={view === "events"} onClick={() => actions.setGatherView("events")}>🎉 Events</button>
      </div>

      {view === "pacts" ? (
        pacts.length ? (
          <div className="feed">
            {pacts.map((it) => <ListingCard key={it.id} item={it} onOpen={(i) => actions.openSheet({ kind: "item", id: i.id })} />)}
          </div>
        ) : (
          <div className="empty"><span className="e">🍃</span>No pacts in this category yet.</div>
        )
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
