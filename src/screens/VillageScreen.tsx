import { useStore } from "../store";
import { VillageScene } from "../components/VillageScene";
import { ListingCard } from "../components/listing";
import { CATS, SPROUT_CAP } from "../data";

export function VillageScreen() {
  const { state, actions } = useStore();
  const appCount = state.village.filter((v) => v.kind === "app").length;
  const offCount = state.village.filter((v) => v.kind === "off").length;
  const mine = state.items.filter((i) => i.name === "You");

  return (
    <>
      <VillageScene />
      <div className="vmeta">
        <div className="vm"><div className="num">{state.village.length}</div><div className="lab">Villagers</div></div>
        <div className="vm"><div className="num">{state.balance} 🌱</div><div className="lab">Sprouts</div></div>
        <div className="vm"><div className="num">⭐ 4.9</div><div className="lab">Your rating</div></div>
      </div>
      <div className="screen-sub" style={{ margin: "10px 2px 2px" }}>
        Everyone you trade with moves in and wanders around. Tap a villager to see who they are. {appCount} from Clover, {offCount} added by you.
      </div>
      <div className="balance" style={{ marginTop: 18 }}>
        <div className="k">YOUR SPROUTS</div>
        <div className="big">{state.balance} <small>/ {SPROUT_CAP} 🌱</small></div>
        <div className="capbar"><span style={{ width: Math.min(100, (state.balance / SPROUT_CAP) * 100) + "%" }} /></div>
        <div className="note">
          {state.balance >= SPROUT_CAP - 5
            ? "Near your cap — spend or gift so sprouts keep moving. Earnings over the cap flow to the pot."
            : "Earn by helping, spend on what you need. One sprout ≈ one hour."}
        </div>
      </div>
      <div className="pot">
        <div className="pot-l">
          <div className="pot-ic">🫙</div>
          <div><b>Community pot</b><span>{state.communityPot} 🌱 · shared by the neighborhood</span></div>
        </div>
        <div className="pot-actions">
          <button className="btn btn-ghost" onClick={() => actions.openSheet({ kind: "gift" })}>Give to pot</button>
          {state.balance < 5 && <button className="btn btn-ghost" onClick={actions.drawFromPot}>Draw a little</button>}
        </div>
      </div>
      <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={actions.demurrageWeek}>⏳ Let a week pass (demo: idle sprouts recirculate)</button>
      <div className="section-h">🌱 Sprout activity</div>
      <div className="ledger">
        {state.activity.map((a, i) => (
          <div className="led" key={i}>
            <div className="ic" style={{ background: CATS[a.cat].c }}>{a.ic}</div>
            <div className="t"><b>{a.t}</b><span>{a.s}</span></div>
            <div className={"amt " + (a.amt > 0 ? "plus" : "minus")}>{a.amt > 0 ? "+" : ""}{a.amt} 🌱</div>
          </div>
        ))}
      </div>
      <div className="section-h">📌 Your posts</div>
      {mine.length ? (
        <div className="feed">{mine.map((it) => <ListingCard key={it.id} item={it} onOpen={(i) => actions.openSheet({ kind: "item", id: i.id })} />)}</div>
      ) : (
        <div className="empty"><span className="e">🌻</span>You haven’t posted yet.<br />Tap + to share something.</div>
      )}
    </>
  );
}
