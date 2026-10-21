import { useStore } from "../store";
import { Character, charFor } from "../character";
import { CATS } from "../data";
import { VillageScene } from "../components/VillageScene";
import { CardArt, themeFor, rarityFor, RARITY_LABEL } from "../components/CardArt";
import type { Cat, CardTheme, CharacterLook, VillageCard, Villager } from "../types";

function BackHeader({ title }: { title: string }) {
  const { actions } = useStore();
  return (
    <div className="chat-head">
      <button className="back" onClick={() => actions.setVillageView("home")}>←</button>
      <div className="ti"><b>{title}</b></div>
    </div>
  );
}

type PlayerCardFields = { name: string; char: CharacterLook; neighborhood: string; cardTheme?: CardTheme; cardFlavor?: string; cardActorX?: number };

/** Build the player's own village card from their profile + current village size. */
export function myCard(player: PlayerCardFields, villagers: number): VillageCard {
  return {
    id: "mine",
    name: player.name,
    char: player.char,
    villageName: `${player.name}’s Village`,
    villagers,
    neighborhood: player.neighborhood,
    flavor: player.cardFlavor?.trim() || "That’s you! 🍀",
    theme: player.cardTheme,
    actorX: player.cardActorX,
  };
}

export function VCard({ card, big }: { card: VillageCard; big?: boolean }) {
  const theme = card.theme ?? themeFor(card.name);
  const rarity = rarityFor(card.villagers);
  return (
    <div className={`vcard theme-${theme} rarity-${rarity}` + (big ? " big" : "")}>
      <span className="vcard-hole" />
      <CardArt theme={theme} villagers={card.villagers} />
      <div className="vcard-actor" style={card.actorX != null ? { left: card.actorX + "%" } : undefined}><Character look={card.char} /></div>
      <div className="vcard-plate">
        <b>{card.villageName}</b>
        <span className="vcard-sub">{card.name}{card.neighborhood ? ` · 🏘️ ${card.neighborhood}` : ""}</span>
        <span className="vcard-flavor">{card.flavor}</span>
      </div>
      <span className="vcard-rarity">{RARITY_LABEL[rarity]}</span>
      <span className="vcard-foil" />
      <span className="vcard-glare" />
    </div>
  );
}

// ---- Giving: streak + goals (shown on the Village home) ----
export function GivingCard() {
  const { state } = useStore();
  return (
    <div className="giving">
      <div className="giving-top">
        <div className="streak">🔥 {state.givingStreak}</div>
        <div><b>Giving streak</b><span>{state.givingStreak} weeks of showing up for neighbors</span></div>
      </div>
      <div className="goals">
        {state.goals.map((g) => {
          const pct = Math.min(100, (g.progress / g.target) * 100);
          const done = g.progress >= g.target;
          return (
            <div className="goal" key={g.id}>
              <div className="goal-l"><span>{g.icon}</span><span className="goal-lab">{g.label}</span><span className="goal-ct">{g.progress}/{g.target}{done ? " ✓" : ""}</span></div>
              <div className="goalbar"><span style={{ width: pct + "%" }} /></div>
            </div>
          );
        })}
      </div>
      <div className="giving-note">Goals reward giving, not spending — finish one for a 🏅 sticker.</div>
    </div>
  );
}

export function VisitView() {
  const { state, actions } = useStore();
  const neighbors = state.village.filter((v) => v.kind === "app");
  return (
    <>
      <BackHeader title="Visit neighbors 🏘️" />
      <div className="screen-sub">Peek into a neighbor’s village, send a sticker, or swap cards.</div>
      {neighbors.length ? neighbors.map((v) => (
        <div className="trow" key={v.name} onClick={() => actions.peek(v.name)}>
          <div className="minichar"><Character look={v.char} /></div>
          <div className="body"><b>{v.name}’s village</b><span>{CATS[v.cat].e} {CATS[v.cat].label}</span></div>
          <button className="go" onClick={(e) => { e.stopPropagation(); actions.peek(v.name); }}>Visit →</button>
        </div>
      )) : <div className="empty"><span className="e">🏘️</span>Trade with neighbors to see their villages here.</div>}
    </>
  );
}

export function PeekView() {
  const { state, actions } = useStore();
  const name = state.peekName ?? "A neighbor";
  const known = state.village.find((x) => x.name === name);
  const char = known?.char ?? charFor(name);
  const n = 3 + (name.length % 4);
  const villagers: Villager[] = ["Ami", "Bo", "Cy", "Di", "El", "Fi", "Gu"].slice(0, n)
    .map((sd) => ({ name: sd, cat: "garden" as Cat, char: charFor(name + sd), kind: "app", note: "" }));
  const card: VillageCard = { id: "peek", name, char, villageName: `${name}’s Village`, villagers: villagers.length + 8, neighborhood: state.player.neighborhood, flavor: "A lovely little village 🌱" };
  return (
    <>
      <BackHeader title={`${name}’s village`} />
      <VillageScene villagers={villagers} playerChar={char} plateName={`${name}’s village`} />
      <div style={{ marginTop: 14 }}><VCard card={card} big /></div>
      <div className="actions" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" onClick={() => actions.openSheet({ kind: "sticker", toName: name })}>✨ Send a sticker</button>
        <button className="btn btn-teal" onClick={() => actions.shareCard(name)}>🃏 Give my card &amp; get theirs</button>
      </div>
    </>
  );
}

export function StickerBinder() {
  const { state } = useStore();
  return (
    <>
      <BackHeader title="Sticker binder ✨" />
      <div className="screen-sub">Stickers neighbors have sent you.</div>
      {state.stickers.length ? (
        <div className="stickergrid">
          {state.stickers.map((s) => <div className="stickercell" key={s.id}><span className="stk">{s.emoji}</span><span className="stkfrom">{s.from}</span></div>)}
        </div>
      ) : <div className="empty"><span className="e">✨</span>No stickers yet. Visit a village and send one to get some back!</div>}
    </>
  );
}

export function CardBinder() {
  const { state, actions } = useStore();
  const my = myCard(state.player, state.village.length);
  return (
    <>
      <BackHeader title="Card binder 🃏" />
      <div className="section-h">Your card</div>
      <VCard card={my} big />
      <button className="btn btn-teal" style={{ margin: "2px 0 4px" }} onClick={() => actions.openSheet({ kind: "editCard" })}>✏️ Edit my card</button>
      <div className="section-h">Collected ({state.cards.length})</div>
      {state.cards.length ? <div className="feed">{state.cards.map((c) => <VCard key={c.id} card={c} />)}</div> : <div className="empty"><span className="e">🃏</span>Swap cards when you visit villages.</div>}
    </>
  );
}

export function CirclesView() {
  const { state, actions } = useStore();
  const villagerNames = state.village.map((v) => v.name);
  return (
    <>
      <BackHeader title="Circles ⭕" />
      <div className="screen-sub">Circles are your people — the neighbors you gather with. Not tied to any place.</div>
      <button className="btn btn-primary" style={{ marginBottom: 14 }} onClick={() => actions.openSheet({ kind: "circle" })}>➕ Create a circle</button>
      {state.circles.map((c) => (
        <div className="circlecard" key={c.id}>
          <div className="circlehead">
            <span className="circ-emoji">{c.emoji}</span>
            <div className="body"><b>{c.name}</b><span>{c.members.length} members</span></div>
            {!c.members.includes("You") && <button className="go" onClick={() => actions.joinCircle(c.id)}>Join</button>}
          </div>
          <div className="circlemembers">{c.members.join(" · ")}</div>
          {villagerNames.filter((n) => !c.members.includes(n)).length > 0 && (
            <div className="circleinvite">
              <span>Invite:</span>
              {villagerNames.filter((n) => !c.members.includes(n)).slice(0, 4).map((n) => (
                <button key={n} className="opt2" onClick={() => actions.inviteToCircle(c.id, n)}>+ {n}</button>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
