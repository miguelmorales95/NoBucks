import type { Cat, Listing } from "../types";
import { CATS } from "../data";

export function initials(name: string): string {
  return name.split(/[ &]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
}

export function Avatar({ name, cat }: { name: string; cat: Cat }) {
  const c = CATS[cat];
  return (
    <div className="avatar" style={{ background: c.c, color: c.ci }}>
      {initials(name)}
      <span className="badge">{c.e}</span>
    </div>
  );
}

/** A listing's photo, or a category-themed placeholder when there's none. */
export function PhotoBanner({ item, big }: { item: Listing; big?: boolean }) {
  const cls = "pbanner" + (big ? " big" : "");
  if (item.photo) {
    return <div className={cls}><img src={item.photo} alt={item.title} /></div>;
  }
  const c = CATS[item.cat];
  return (
    <div className={cls + " ph"} style={{ background: `linear-gradient(135deg, ${c.c}, ${c.ci}44)` }}>
      <span>{c.e}</span>
    </div>
  );
}

export function RateBadge({ item }: { item: Listing }) {
  return <span className="rate">⭐ <b>{item.rating.toFixed(1)}</b> · {item.reviews}</span>;
}

export function TypeTag({ type }: { type: Listing["type"] }) {
  const label = type === "offer" ? "Offering" : type === "request" ? "Looking for" : "Pact";
  return <span className={"tag " + type}>{label}</span>;
}

export function PriceTag({ item }: { item: Listing }) {
  if (item.cost === "barter") return <span className="price">🔁 <small>Barter</small></span>;
  if (item.cost === "pact") return <span className="price">♾️ <small>Weekly</small></span>;
  return <span className="price">{item.cost} 🌱{item.unit ? <small>&nbsp;/ {item.unit}</small> : null}</span>;
}

export function priceText(item: Listing): string {
  if (item.cost === "barter") return "Barter";
  if (item.cost === "pact") return "Weekly pact";
  return `${item.cost} 🌱`;
}

export function ListingCard({ item, onOpen }: { item: Listing; onOpen: (item: Listing) => void }) {
  return (
    <article className="card" onClick={() => onOpen(item)}>
      <PhotoBanner item={item} />
      <div className="row">
        <Avatar name={item.name} cat={item.cat} />
        <div className="body">
          <div className="meta">
            <span>{item.name}</span><span className="dot" />
            {item.neighborhood && <><span>🏘️ {item.neighborhood}</span><span className="dot" /></>}
            <span>{item.dist ? item.dist + " mi" : "nearby"}</span><span className="dot" />
            <RateBadge item={item} />
          </div>
          <h3>{item.title}</h3>
          <p>{item.blurb}</p>
        </div>
      </div>
      <div className="foot"><TypeTag type={item.type} /><PriceTag item={item} /></div>
    </article>
  );
}
