import { useStore } from "../store";
import { CATS, CAT_KEYS, DIST, nearbyHoods } from "../data";
import { Avatar, ListingCard, priceText } from "../components/listing";
import type { Listing } from "../types";

function inScope(i: Listing, scope: "mine" | "nearby" | "all", home: string): boolean {
  if (i.name === "You" || scope === "all") return true;
  if (scope === "mine") return i.neighborhood === home;
  return nearbyHoods(home).includes(i.neighborhood ?? "");
}

const MAP_SVG = `
<svg class="base" viewBox="0 0 400 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<rect width="400" height="460" fill="var(--map-land)"/>
<g fill="var(--map-block)"><rect x="18" y="24" width="120" height="86" rx="12"/><rect x="262" y="30" width="118" height="80" rx="12"/><rect x="20" y="270" width="110" height="100" rx="12"/><rect x="268" y="266" width="116" height="110" rx="12"/></g>
<path d="M352 -10 C330 80 410 140 360 220 C320 300 400 360 360 460 L420 460 L420 -10 Z" fill="var(--map-water)"/>
<ellipse cx="150" cy="212" rx="34" ry="20" fill="var(--map-water)"/>
<g stroke="var(--map-road)" stroke-width="22" stroke-linecap="round"><line x1="-10" y1="140" x2="410" y2="140"/><line x1="-10" y1="262" x2="410" y2="262"/><line x1="-10" y1="390" x2="410" y2="390"/><line x1="150" y1="-10" x2="150" y2="470"/><line x1="300" y1="-10" x2="300" y2="470"/></g>
<rect x="178" y="166" width="150" height="110" rx="28" fill="var(--map-park)"/>
<g fill="var(--map-tree)"><circle cx="206" cy="196" r="13"/><circle cx="246" cy="186" r="11"/><circle cx="292" cy="200" r="14"/><circle cx="226" cy="240" r="12"/><circle cx="284" cy="248" r="12"/></g>
</svg>`;

function ChipsBar() {
  const { state, actions } = useStore();
  return (
    <div className="chips">
      <button className="chip" aria-pressed={state.filter === "all"} onClick={() => actions.setFilter("all")}>✨ All</button>
      {CAT_KEYS.map((k) => (
        <button key={k} className="chip" aria-pressed={state.filter === k} onClick={() => actions.setFilter(k)}>
          <span className="e">{CATS[k].e}</span>{CATS[k].label}
        </button>
      ))}
    </div>
  );
}

function DistanceSlider() {
  const { state, actions } = useStore();
  const pct = ((state.maxDist - DIST.min) / (DIST.max - DIST.min)) * 100;
  const label = state.maxDist >= DIST.max ? "Anywhere in LA" : `Within ${state.maxDist} mi`;
  return (
    <div className="distbox">
      <div className="dl"><span className="lab">Distance</span><span className="val">{label}</span></div>
      <input
        type="range" className="slider" min={DIST.min} max={DIST.max} step={DIST.step} value={state.maxDist}
        style={{ ["--pct" as any]: pct + "%" }}
        onChange={(e) => actions.setMaxDist(parseFloat(e.target.value))}
      />
      <div className="ends"><span>½ mi</span><span>walkable · nearby · all LA</span><span>{DIST.max} mi</span></div>
    </div>
  );
}

function MapView() {
  const { state, actions } = useStore();
  const home = state.player.neighborhood;
  const pins = state.items.filter((i) => i.mx != null && !state.blocked.includes(i.name));
  const sel = state.selectedPin ? state.items.find((i) => i.id === state.selectedPin) : null;
  return (
    <div className="mapwrap">
      <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: MAP_SVG }} />
      <div className="youpin" style={{ left: "50%", top: "50%" }}><span className="ring" /><span className="lab">You</span></div>
      {pins.map((p) => {
        const dim = (state.filter !== "all" && p.cat !== state.filter)
          || !inScope(p, state.hoodScope, home)
          || (state.hoodScope === "all" && p.dist > state.maxDist);
        return (
          <button key={p.id} className={"pin" + (dim ? " dim" : "")} aria-pressed={state.selectedPin === p.id}
            style={{ left: p.mx + "%", top: p.my + "%", ["--pc" as any]: CATS[p.cat].ci }}
            onClick={() => actions.selectPin(state.selectedPin === p.id ? null : p.id)}>
            <span className="drop">{CATS[p.cat].e}</span>
          </button>
        );
      })}
      {sel && (
        <div className="mprev">
          <Avatar name={sel.name} cat={sel.cat} />
          <div className="body">
            <b>{sel.title}</b>
            <span>{sel.name} · {sel.dist} mi · ⭐ {sel.rating.toFixed(1)} · {priceText(sel)}</span>
          </div>
          <button className="go" onClick={() => actions.openSheet({ kind: "item", id: sel.id })}>View</button>
        </div>
      )}
    </div>
  );
}

function GratitudesFeed() {
  const { state } = useStore();
  if (!state.gratitudes.length) {
    return <div className="empty"><span className="e">💛</span>No thank-yous yet.<br />Finish a trade and leave the first one!</div>;
  }
  return (
    <div className="feed">
      {state.gratitudes.map((g) => (
        <div className="grat" key={g.id}>
          <Avatar name={g.fromName} cat={g.cat} />
          <div className="gbody">
            <div className="ghead"><b>{g.fromName}</b> thanked <b>{g.toName}</b> <span className="gwhen">· {g.when}</span></div>
            <div className="gtext">“{g.text}”</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExploreScreen() {
  const { state, actions } = useStore();
  const open = (item: Listing) => actions.openSheet({ kind: "item", id: item.id });
  const q = state.query.trim().toLowerCase();
  const home = state.player.neighborhood;
  const list = state.items.filter(
    (i) => (i.type === "offer" || i.type === "request")
      && (state.filter === "all" || i.cat === state.filter)
      && inScope(i, state.hoodScope, home)
      && (state.hoodScope !== "all" || i.name === "You" || i.dist <= state.maxDist)
      && !state.blocked.includes(i.name)
      && (!q || `${i.title} ${i.blurb} ${i.name}`.toLowerCase().includes(q))
  );

  return (
    <>
      <div className="screen-title">{state.exView === "thanks" ? "Gratitudes 💛" : state.exView === "map" ? "Explore the map" : "What’s growing nearby 🌼"}</div>
      <div className="screen-sub">
        {state.exView === "thanks"
          ? "Thank-yous from neighbors after real trades — kindness made visible."
          : state.exView === "map"
          ? "Pick an area, then tap a pin to peek. Out-of-area pins fade out."
          : "Offers and asks from neighbors. Start in your area, reach wider when you need to."}
      </div>
      <div className="seg">
        <button aria-pressed={state.exView === "list"} onClick={() => actions.setExView("list")}>🗂️ List</button>
        <button aria-pressed={state.exView === "map"} onClick={() => actions.setExView("map")}>🗺️ Map</button>
        <button aria-pressed={state.exView === "thanks"} onClick={() => actions.setExView("thanks")}>💛 Thanks</button>
      </div>
      {state.exView !== "thanks" && (
        <>
          <div className="seg">
            <button aria-pressed={state.hoodScope === "mine"} onClick={() => actions.setHoodScope("mine")}>🏡 {state.player.neighborhood}</button>
            <button aria-pressed={state.hoodScope === "nearby"} onClick={() => actions.setHoodScope("nearby")}>🏘️ Nearby</button>
            <button aria-pressed={state.hoodScope === "all"} onClick={() => actions.setHoodScope("all")}>🌆 All LA</button>
          </div>
          {state.exView === "list" && (
            <div className="field" style={{ marginBottom: 12 }}>
              <input value={state.query} placeholder="Search offers & requests…" onChange={(e) => actions.setQuery(e.target.value)} />
            </div>
          )}
          {state.hoodScope === "all" && <DistanceSlider />}
          <ChipsBar />
        </>
      )}
      {state.exView === "thanks" ? <GratitudesFeed />
        : state.exView === "map" ? <MapView />
        : (
        <div className="feed">
          {list.length
            ? list.map((it) => <ListingCard key={it.id} item={it} onOpen={open} />)
            : <div className="empty"><span className="e">🍃</span>{
                q ? <>No matches for “{state.query}”.</>
                : state.hoodScope !== "all" ? <>Nothing in this area yet —<br />try Nearby or All&nbsp;LA.</>
                : <>Nothing within {state.maxDist} mi —<br />drag the slider wider.</>
              }</div>}
        </div>
      )}
    </>
  );
}
