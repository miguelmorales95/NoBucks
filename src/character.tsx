import type { CharacterLook } from "./types";
import { SPECIES, SKINS, FURS, HAIRCOLORS, HAIRS, SHIRTS, ACCS, OUTFITS, HATS } from "./data";

export function paletteFor(look: CharacterLook): string[] {
  return SPECIES[look.species].k === "person" ? SKINS : FURS;
}

/** Build the inner SVG markup for a cutesy human or animal character. */
export function characterInner(d: CharacterLook): string {
  const sp = SPECIES[d.species].k;
  const isPerson = sp === "person";
  const p = isPerson ? SKINS : FURS;
  const body = p[d.skin % p.length];
  const accent = HAIRCOLORS[d.haircolor % HAIRCOLORS.length];
  const shirt = SHIRTS[d.shirt % SHIRTS.length];
  const acc = ACCS[d.acc];

  const shirtPath =
    `<path d="M12 112 L12 88 Q12 70 32 68 L68 68 Q88 70 88 112 Z" fill="${shirt}"/>` +
    `<path d="M40 68 Q50 78 60 68" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="2"/>`;
  const head = `<circle cx="50" cy="46" r="27" fill="${body}"/>`;
  let back = "", front = "", faceSkip = false, extra = "";

  if (sp === "person") {
    back = `<circle cx="22" cy="48" r="6" fill="${body}"/><circle cx="78" cy="48" r="6" fill="${body}"/>`;
    const st = HAIRS[d.hair % HAIRS.length];
    if (st === "long") back = `<rect x="17" y="40" width="11" height="48" rx="5.5" fill="${accent}"/><rect x="72" y="40" width="11" height="48" rx="5.5" fill="${accent}"/>` + back;
    if (st === "bun") back = `<circle cx="50" cy="15" r="10" fill="${accent}"/>` + back;
    if (st === "curly") front = `<g fill="${accent}"><circle cx="28" cy="34" r="10"/><circle cx="40" cy="24" r="11"/><circle cx="54" cy="21" r="11"/><circle cx="68" cy="26" r="10"/><circle cx="74" cy="38" r="9"/></g>`;
    else if (st === "buzz") front = `<path d="M25 44 C29 24 71 24 75 44 C66 32 34 32 25 44 Z" fill="${accent}" opacity=".9"/>`;
    else front = `<path d="M22 46 C22 14 78 14 78 46 C68 28 32 28 22 46 Z" fill="${accent}"/>`;
  } else if (sp === "cat") {
    back = `<path d="M26 30 L31 9 L45 25 Z" fill="${body}"/><path d="M74 30 L69 9 L55 25 Z" fill="${body}"/><path d="M31 27 L33 16 L41 25 Z" fill="${accent}"/><path d="M69 27 L67 16 L59 25 Z" fill="${accent}"/>`;
    front = `<path d="M46 53 L54 53 L50 57 Z" fill="#c76a6a"/><g stroke="${accent}" stroke-width="1.2" opacity=".55" stroke-linecap="round"><line x1="20" y1="53" x2="35" y2="55"/><line x1="20" y1="58" x2="35" y2="57"/><line x1="80" y1="53" x2="65" y2="55"/><line x1="80" y1="58" x2="65" y2="57"/></g>`;
  } else if (sp === "dog") {
    back = `<ellipse cx="21" cy="50" rx="9" ry="17" fill="${accent}"/><ellipse cx="79" cy="50" rx="9" ry="17" fill="${accent}"/>`;
    front = `<ellipse cx="50" cy="56" rx="12" ry="9" fill="rgba(255,255,255,.5)"/><ellipse cx="50" cy="52" rx="3.6" ry="2.8" fill="#3a2d26"/>`;
  } else if (sp === "bear") {
    back = `<circle cx="29" cy="24" r="10" fill="${body}"/><circle cx="71" cy="24" r="10" fill="${body}"/><circle cx="29" cy="24" r="5" fill="${accent}"/><circle cx="71" cy="24" r="5" fill="${accent}"/>`;
    front = `<ellipse cx="50" cy="55" rx="10" ry="8" fill="rgba(255,255,255,.45)"/><ellipse cx="50" cy="51" rx="3.4" ry="2.6" fill="#3a2d26"/>`;
  } else if (sp === "rabbit") {
    back = `<ellipse cx="40" cy="12" rx="6.5" ry="20" fill="${body}"/><ellipse cx="60" cy="12" rx="6.5" ry="20" fill="${body}"/><ellipse cx="40" cy="13" rx="3" ry="14" fill="#f3b6c4"/><ellipse cx="60" cy="13" rx="3" ry="14" fill="#f3b6c4"/>`;
    front = `<path d="M47 53 L53 53 L50 57 Z" fill="#e58aa0"/>`;
  } else if (sp === "fox") {
    back = `<path d="M25 30 L29 8 L46 26 Z" fill="${body}"/><path d="M75 30 L71 8 L54 26 Z" fill="${body}"/><path d="M30 27 L31 16 L40 25 Z" fill="#2d2018"/><path d="M70 27 L69 16 L60 25 Z" fill="#2d2018"/>`;
    front = `<path d="M50 42 Q33 54 43 65 Q50 70 57 65 Q67 54 50 42 Z" fill="rgba(255,255,255,.78)"/><path d="M46 55 L54 55 L50 60 Z" fill="#2d2018"/>`;
  } else if (sp === "frog") {
    back = `<circle cx="35" cy="24" r="11" fill="${body}"/><circle cx="65" cy="24" r="11" fill="${body}"/>`;
    front = `<circle cx="35" cy="23" r="6" fill="#fff"/><circle cx="65" cy="23" r="6" fill="#fff"/><circle cx="35" cy="24" r="3" fill="#222"/><circle cx="65" cy="24" r="3" fill="#222"/>` +
      `<path d="M36 54 Q50 64 64 54" stroke="#2d6a4a" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      `<circle cx="33" cy="50" r="4.5" fill="#f28ba0" opacity=".45"/><circle cx="67" cy="50" r="4.5" fill="#f28ba0" opacity=".45"/>`;
    faceSkip = true;
  } else if (sp === "bird") {
    front = `<path d="M46 20 Q50 8 55 20 Z" fill="${accent}"/><path d="M43 51 L57 51 L50 60 Z" fill="#f2a93e"/>`;
  }

  const face = faceSkip ? "" :
    `<circle cx="40.5" cy="48" r="3.6" fill="#3a2d26"/><circle cx="59.5" cy="48" r="3.6" fill="#3a2d26"/>` +
    `<circle cx="34" cy="56" r="5" fill="#f28ba0" opacity=".5"/><circle cx="66" cy="56" r="5" fill="#f28ba0" opacity=".5"/>` +
    `<path d="M43 57 Q50 63 57 57" stroke="#3a2d26" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

  if (acc === "glasses") extra = `<g fill="none" stroke="#3a2d26" stroke-width="2.2"><circle cx="40.5" cy="48" r="7.5"/><circle cx="59.5" cy="48" r="7.5"/><line x1="48" y1="48" x2="52" y2="48"/></g>`;
  else if (acc === "flower") extra = `<g transform="translate(72,24)"><circle cx="0" cy="-5" r="3.4" fill="#ff9ec4"/><circle cx="5" cy="0" r="3.4" fill="#ff9ec4"/><circle cx="-5" cy="0" r="3.4" fill="#ff9ec4"/><circle cx="2.5" cy="4.5" r="3.4" fill="#ff9ec4"/><circle cx="-2.5" cy="4.5" r="3.4" fill="#ff9ec4"/><circle cx="0" cy="0" r="2.6" fill="#f7d24a"/></g>`;
  else if (acc === "freckles") extra = `<g fill="#b9745a" opacity=".6"><circle cx="31" cy="54" r="1.1"/><circle cx="35" cy="57" r="1.1"/><circle cx="33" cy="60" r="1.1"/><circle cx="69" cy="54" r="1.1"/><circle cx="65" cy="57" r="1.1"/><circle cx="67" cy="60" r="1.1"/></g>`;

  // ---- outfit (over the shirt) ----
  const outfitId = OUTFITS[(d.outfit ?? 0) % OUTFITS.length].id;
  let outfit = "";
  if (outfitId === "stripes") outfit = `<g stroke="rgba(255,255,255,.55)" stroke-width="4"><line x1="16" y1="84" x2="84" y2="84"/><line x1="14" y1="96" x2="86" y2="96"/></g>`;
  else if (outfitId === "overalls") outfit = `<path d="M32 112 L32 82 Q32 76 42 76 L58 76 Q68 76 68 82 L68 112 Z" fill="#4a6fa8"/><rect x="34" y="68" width="6" height="14" fill="#4a6fa8"/><rect x="60" y="68" width="6" height="14" fill="#4a6fa8"/><circle cx="37" cy="84" r="2" fill="#f0c020"/><circle cx="63" cy="84" r="2" fill="#f0c020"/>`;
  else if (outfitId === "hoodie") outfit = `<path d="M30 70 Q50 60 70 70 L66 80 Q50 72 34 80 Z" fill="rgba(0,0,0,.14)"/><rect x="38" y="92" width="24" height="12" rx="3" fill="rgba(0,0,0,.1)"/><line x1="46" y1="74" x2="46" y2="88" stroke="#fff" stroke-width="2"/><line x1="54" y1="74" x2="54" y2="88" stroke="#fff" stroke-width="2"/>`;
  else if (outfitId === "dress") outfit = `<path d="M24 112 L34 86 L66 86 L76 112 Z" fill="${shirt}"/><path d="M24 112 L34 86 L66 86 L76 112 Z" fill="rgba(255,255,255,.14)"/>`;
  else if (outfitId === "apron") outfit = `<path d="M40 74 L42 110 L58 110 L60 74 Z" fill="rgba(255,255,255,.62)"/><path d="M43 74 Q50 66 57 74" stroke="rgba(255,255,255,.62)" stroke-width="3" fill="none"/>`;
  else if (outfitId === "jersey") outfit = `<rect x="12" y="78" width="76" height="6" fill="rgba(255,255,255,.5)"/><text x="50" y="104" font-size="20" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">7</text>`;
  else if (outfitId === "suit") outfit = `<path d="M50 70 L38 110 L45 110 L50 84 L55 110 L62 110 Z" fill="rgba(0,0,0,.2)"/><path d="M48 76 L52 76 L54 96 L50 102 L46 96 Z" fill="#b5423a"/>`;

  // ---- hat (on top of everything) ----
  const hatId = HATS[(d.hat ?? 0) % HATS.length].id;
  let hat = "";
  if (hatId === "cap") hat = `<path d="M30 27 Q50 7 70 27 Z" fill="#e0574a"/><path d="M62 27 L88 31 L62 33 Z" fill="#c54a3e"/>`;
  else if (hatId === "beanie") hat = `<path d="M28 30 Q50 6 72 30 Z" fill="#6a8fd0"/><rect x="28" y="26" width="44" height="7" rx="3" fill="#567abe"/>`;
  else if (hatId === "flowercrown") hat = `<g fill="#ff9ec4"><circle cx="34" cy="20" r="3.2"/><circle cx="45" cy="15" r="3.2"/><circle cx="55" cy="15" r="3.2"/><circle cx="66" cy="20" r="3.2"/></g><g fill="#f7d24a"><circle cx="34" cy="20" r="1.3"/><circle cx="45" cy="15" r="1.3"/><circle cx="55" cy="15" r="1.3"/><circle cx="66" cy="20" r="1.3"/></g>`;
  else if (hatId === "party") hat = `<path d="M50 1 L60 28 L40 28 Z" fill="#f0b23e"/><circle cx="50" cy="1" r="3" fill="#e05a4a"/><circle cx="46" cy="16" r="2" fill="#fff"/><circle cx="55" cy="22" r="2" fill="#fff"/>`;
  else if (hatId === "captain") hat = `<path d="M28 28 L72 28 L68 15 Q50 7 32 15 Z" fill="#20304a"/><rect x="26" y="26" width="48" height="6" rx="2" fill="#16233a"/><circle cx="50" cy="19" r="4" fill="#f0c020"/>`;
  else if (hatId === "hardhat") hat = `<path d="M30 28 Q50 6 70 28 Z" fill="#f2c200"/><rect x="26" y="26" width="48" height="5" rx="2" fill="#e0b000"/><rect x="48" y="12" width="4" height="12" fill="#e0b000"/>`;

  return shirtPath + outfit + back + head + front + face + extra + hat;
}

export function Character({ look, className }: { look: CharacterLook; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 114"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: characterInner(look) }}
    />
  );
}

// ---- deterministic + random looks ----
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const rnd = (n: number) => Math.floor(Math.random() * n);

export function charFor(seed: string): CharacterLook {
  const h = hashStr(seed);
  return {
    species: (h >> 15) % SPECIES.length,
    skin: h % FURS.length,
    haircolor: (h >> 3) % HAIRCOLORS.length,
    hair: (h >> 6) % HAIRS.length,
    shirt: (h >> 9) % SHIRTS.length,
    acc: (h >> 12) % ACCS.length,
    outfit: (h >> 18) % OUTFITS.length,
    hat: (h >> 21) % HATS.length,
  };
}
export function randomChar(): CharacterLook {
  return {
    species: rnd(SPECIES.length),
    skin: rnd(FURS.length),
    haircolor: rnd(HAIRCOLORS.length),
    hair: rnd(HAIRS.length),
    shirt: rnd(SHIRTS.length),
    acc: rnd(ACCS.length),
    outfit: rnd(5),
    hat: rnd(4),
  };
}
export function cloneChar(c: CharacterLook): CharacterLook {
  return { species: c.species, skin: c.skin, haircolor: c.haircolor, hair: c.hair, shirt: c.shirt, acc: c.acc, outfit: c.outfit ?? 0, hat: c.hat ?? 0 };
}
