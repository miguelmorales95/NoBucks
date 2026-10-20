import { useStore } from "../store";
import { ListingCard } from "../components/listing";

export function PactsScreen() {
  const { state, actions } = useStore();
  const list = state.items.filter((i) => i.type === "pact" && (state.filter === "all" || i.cat === state.filter) && !state.blocked.includes(i.name));
  return (
    <>
      <div className="screen-title">Pacts 🤝</div>
      <div className="screen-sub">Standing swaps neighbors keep going together. See one you’d fit into? Ask to join.</div>
      {list.length ? (
        <div className="feed">
          {list.map((it) => <ListingCard key={it.id} item={it} onOpen={(i) => actions.openSheet({ kind: "item", id: i.id })} />)}
        </div>
      ) : (
        <div className="empty"><span className="e">🍃</span>No pacts in this category yet.</div>
      )}
    </>
  );
}
