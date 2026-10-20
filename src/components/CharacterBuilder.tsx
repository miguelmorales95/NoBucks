import type { CharacterLook } from "../types";
import { SPECIES, SKINS, FURS, HAIRCOLORS, HAIRS, SHIRTS, ACCS, OUTFITS, HATS } from "../data";

export function CharacterBuilder({
  look, onChange, wardrobe,
}: { look: CharacterLook; onChange: (next: CharacterLook) => void; wardrobe?: string[] }) {
  const isPerson = SPECIES[look.species].k === "person";

  function set(key: keyof CharacterLook, i: number) {
    const next = { ...look, [key]: i };
    if (key === "species") {
      const palLen = (SPECIES[i].k === "person" ? SKINS : FURS).length;
      next.skin = Math.min(look.skin, palLen - 1);
    }
    onChange(next);
  }

  const colorRow = (label: string, key: keyof CharacterLook, arr: string[]) => (
    <div className="picker">
      <div className="pl">{label}</div>
      <div className="swatches">
        {arr.map((val, i) => (
          <button key={i} className="sw" aria-pressed={look[key] === i} style={{ background: val }} aria-label={`${label} ${i + 1}`} onClick={() => set(key, i)} />
        ))}
      </div>
    </div>
  );
  const optRow = (label: string, key: keyof CharacterLook, arr: string[]) => (
    <div className="picker">
      <div className="pl">{label}</div>
      <div className="opts">
        {arr.map((val, i) => (
          <button key={i} className="opt2" aria-pressed={look[key] === i} onClick={() => set(key, i)}>{val}</button>
        ))}
      </div>
    </div>
  );
  const wearRow = (label: string, key: keyof CharacterLook, arr: { id: string; name: string; earn?: string }[]) => (
    <div className="picker">
      <div className="pl">{label}</div>
      <div className="opts">
        {arr.map((o, i) => {
          const locked = wardrobe ? !wardrobe.includes(o.id) : false;
          return (
            <button key={o.id} className={"opt2" + (locked ? " locked" : "")} aria-pressed={look[key] === i}
              disabled={locked} title={locked && o.earn ? `Earn: ${o.earn}` : o.name}
              onClick={() => { if (!locked) set(key, i); }}>
              {locked ? "🔒 " : ""}{o.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div className="picker">
        <div className="pl">Who are you?</div>
        <div className="opts">
          {SPECIES.map((sp, i) => (
            <button key={i} className="spbtn" aria-pressed={look.species === i} onClick={() => set("species", i)}>{sp.e}</button>
          ))}
        </div>
      </div>
      {colorRow(isPerson ? "Skin" : "Fur", "skin", isPerson ? SKINS : FURS)}
      {isPerson && optRow("Hair", "hair", HAIRS)}
      {colorRow(isPerson ? "Hair colour" : "Markings", "haircolor", HAIRCOLORS)}
      {wearRow("Outfit", "outfit", OUTFITS)}
      {wearRow("Hat", "hat", HATS)}
      {colorRow("Colour", "shirt", SHIRTS)}
      {optRow("Extra", "acc", ACCS)}
    </div>
  );
}
