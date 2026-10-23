import { useStore } from "../store";
import { VillageScene } from "../components/VillageScene";
import { ListingCard } from "../components/listing";
import { CATS, SPROUT_CAP, VILLAGE_THEMES } from "../data";
import { VisitView, PeekView, StickerBinder, CardBinder, GivingCard } from "./VillageExtras";

export function VillageScreen() {
  const { state } = useStore();
  switch (state.villageView) {
    case "visit": return <VisitView />;
    case "peek": return <PeekView />;
    case "stickers": return <StickerBinder />;
    case "cards": return <CardBinder />;
    default: return <VillageHome />;
  }
}

const wxIcon = (c: string) => (c === "rain" ? "🌧️" : c === "snow" ? "🌨️" : c === "clouds" ? "☁️" : "☀️");

function VillageHome() {
  const { state, actions } = useStore();
  const appCount = state.village.filter((v) => v.kind === "app").length;
  const offCount = state.village.filter((v) => v.kind === "off").length;
  const mine = state.items.filter((i) => i.name === "You");
  const expiringSoon = state.sproutBatches.filter((b) => b.wk >= 4).reduce((a, b) => a + b.amt, 0);

  return (
    <>
      {state.weather && <div className="wxchip">{wxIcon(state.weather.condition)} {state.weather.label}</div>}
      <VillageScene />
      <div className="vmeta">
        <div className="vm"><div className="num">{state.village.length}</div><div className="lab">Villagers</div></div>
        <div className="vm"><div className="num">{state.balance} 🌱</div><div className="lab">Sprouts</div></div>
        <div className="vm"><div className="num">⭐ 4.9</div><div className="lab">Your rating</div></div>
      </div>

      <div className="social-row">
        <button onClick={() => actions.setVillageView("visit")}>🏘️<span>Visit</span></button>
        <button onClick={() => actions.setVillageView("stickers")}>✨<span>Stickers</span></button>
        <button onClick={() => actions.setVillageView("cards")}>🃏<span>Cards</span></button>
      </div>

      <div className="theme-row">
        {VILLAGE_THEMES.map((t) => (
          <button key={t.id} aria-pressed={state.player.villageTheme === t.id} title={t.name} onClick={() => actions.setVillageTheme(t.id)}>{t.e}</button>
        ))}
        <button className="dressbtn" onClick={() => actions.openSheet({ kind: "wardrobe" })}>👕 Change look</button>
      </div>

      <div className="screen-sub" style={{ margin: "12px 2px 0" }}>
        Everyone you trade with moves in and wanders around. {appCount} from NoBucks, {offCount} added by you.
      </div>

      <div className="section-h">🎯 Your giving</div>
      <GivingCard />

      <div className="balance" style={{ marginTop: 18 }}>
        <div className="k">YOUR SPROUTS</div>
        <div className="big">{state.balance} <small>/ {SPROUT_CAP} 🌱</small></div>
        <div className="capbar"><span style={{ width: Math.min(100, (state.balance / SPROUT_CAP) * 100) + "%" }} /></div>
        <div className="note">
          {expiringSoon > 0
            ? `${expiringSoon} 🌱 expiring soon — spend or gift them before they return to the pot.`
            : state.balance >= SPROUT_CAP - 5
            ? "Near your cap — gift some so sprouts keep moving."
            : "Earn by helping, spend on what you need. Sprouts expire if idle too long."}
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
      <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={actions.demurrageWeek}>⏳ Let a week pass (sprouts age &amp; expire)</button>
      {state.player.role === "leader" ? (
        <button className="btn btn-teal" style={{ marginTop: 10 }} onClick={actions.openAdmin}>🛡️ Community tools</button>
      ) : (
        <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={actions.claimLeader}>Become a community leader (demo)</button>
      )}

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
