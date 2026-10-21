import { useId, type CSSProperties } from "react";
import type { CardTheme } from "../types";

// ---- themes & rarity ---------------------------------------------------------

export type { CardTheme };
export const CARD_THEMES: CardTheme[] = ["stadium", "cafe", "arcade", "beach", "garden", "cosmic"];

export const CARD_THEME_LABELS: Record<CardTheme, string> = {
  stadium: "Stadium 🏟️",
  cafe: "Café ☕",
  arcade: "Arcade 👾",
  beach: "Beach 🏖️",
  garden: "Garden 🌱",
  cosmic: "Cosmic 🪐",
};

export type Rarity = "common" | "rare" | "epic" | "legendary";
export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic ✦",
  legendary: "Legendary ✦✦",
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic default theme for a card, so a neighbor's card always looks the same. */
export function themeFor(name: string): CardTheme {
  return CARD_THEMES[hashStr(name) % CARD_THEMES.length];
}

/** Bigger villages earn shinier cards — ties the number to the foil. */
export function rarityFor(villagers: number): Rarity {
  if (villagers >= 25) return "legendary";
  if (villagers >= 18) return "epic";
  if (villagers >= 11) return "rare";
  return "common";
}

// ---- scene art ---------------------------------------------------------------
// Each scene fills a 300×150 band (sliced to fill the card). The big villager
// number is drawn INTO the art — a scoreboard, a clock, a high-score, the sun,
// a carved sign or a planet — with the character standing in front of it.

function Num({ n, x, y, size, fill, family, style }: {
  n: number; x: number; y: number; size: number; fill: string; family?: string; style?: CSSProperties;
}) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={800} fill={fill} textAnchor="middle"
      fontFamily={family ?? "'Baloo 2','Segoe UI',sans-serif"} style={style} dominantBaseline="middle">
      {n}
    </text>
  );
}

function Scene({ theme, n, uid }: { theme: CardTheme; n: number; uid: string }) {
  const id = (s: string) => `${s}-${uid}`;
  switch (theme) {
    case "stadium":
      return (
        <svg className="vcard-scene" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2a4a7a" /><stop offset="1" stopColor="#6aa0d8" />
            </linearGradient>
            <radialGradient id={id("fl")} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff6d8" stopOpacity="0.9" /><stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="300" height="150" fill={`url(#${id("sky")})`} />
          {/* floodlights */}
          <circle cx="40" cy="20" r="34" fill={`url(#${id("fl")})`} />
          <circle cx="260" cy="20" r="34" fill={`url(#${id("fl")})`} />
          <rect x="34" y="6" width="12" height="7" rx="2" fill="#dfe8f2" /><rect x="38" y="13" width="4" height="40" fill="#9fb0c4" />
          <rect x="254" y="6" width="12" height="7" rx="2" fill="#dfe8f2" /><rect x="258" y="13" width="4" height="40" fill="#9fb0c4" />
          {/* pitch */}
          <path d="M-20 150 L70 86 L230 86 L320 150 Z" fill="#3f9a52" />
          <path d="M-20 150 L70 86 L130 86 L60 150 Z" fill="#46a559" />
          <path d="M160 86 L230 86 L320 150 L210 150 Z" fill="#46a559" />
          <path d="M40 150 Q150 120 260 150" stroke="#eafff0" strokeWidth="2" fill="none" opacity="0.7" />
          <ellipse cx="150" cy="96" rx="30" ry="7" fill="none" stroke="#eafff0" strokeWidth="2" opacity="0.6" />
          {/* scoreboard */}
          <g transform="translate(176,18)">
            <rect x="0" y="0" width="104" height="54" rx="7" fill="#10203a" stroke="#f2c230" strokeWidth="2.5" />
            <rect x="6" y="6" width="92" height="42" rx="4" fill="#061324" />
            <text x="52" y="17" fontSize="9" fontWeight={700} fill="#f2c230" textAnchor="middle" fontFamily="'Segoe UI',sans-serif" letterSpacing="1">VILLAGERS</text>
            <Num n={n} x={52} y={34} size={26} fill="#5bf2a0" family="'Courier New',monospace" style={{ letterSpacing: "2px" }} />
          </g>
        </svg>
      );

    case "cafe":
      return (
        <svg className="vcard-scene" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={id("wall")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8a5a3c" /><stop offset="1" stopColor="#6a4228" />
            </linearGradient>
            <radialGradient id={id("win")} cx="0.5" cy="0.4" r="0.7">
              <stop offset="0" stopColor="#ffe6a8" /><stop offset="1" stopColor="#e0a85a" />
            </radialGradient>
          </defs>
          <rect width="300" height="150" fill={`url(#${id("wall")})`} />
          <rect x="0" y="110" width="300" height="40" fill="#4a2e1a" />
          <rect x="0" y="108" width="300" height="4" fill="#caa06a" />
          {/* window */}
          <g transform="translate(18,20)">
            <rect x="0" y="0" width="70" height="78" rx="4" fill={`url(#${id("win")})`} stroke="#3a2416" strokeWidth="4" />
            <line x1="35" y1="0" x2="35" y2="78" stroke="#3a2416" strokeWidth="3" /><line x1="0" y1="39" x2="70" y2="39" stroke="#3a2416" strokeWidth="3" />
          </g>
          {/* pendant light */}
          <line x1="150" y1="0" x2="150" y2="16" stroke="#2a1a10" strokeWidth="2" />
          <path d="M138 16 L162 16 L156 30 L144 30 Z" fill="#2a1a10" />
          <ellipse cx="150" cy="40" rx="30" ry="18" fill="#ffd98a" opacity="0.35" />
          {/* wall clock with the number as the hour */}
          <g transform="translate(248,52)">
            <circle r="34" fill="#f3e6cf" stroke="#2a1a10" strokeWidth="5" />
            <circle r="34" fill="none" stroke="#caa06a" strokeWidth="1.5" />
            <Num n={n} x={0} y={2} size={30} fill="#3a2416" />
            <text x={0} y={22} fontSize="7" fontWeight={700} fill="#8a6a44" textAnchor="middle" fontFamily="'Segoe UI',sans-serif" letterSpacing="1">VILLAGERS</text>
            <circle r="2.4" fill="#3a2416" />
          </g>
          {/* little cafe table + cup */}
          <ellipse cx="120" cy="118" rx="26" ry="6" fill="#3a2416" />
          <rect x="118" y="118" width="4" height="22" fill="#2a1a10" />
          <g transform="translate(112,104)"><rect x="0" y="0" width="12" height="9" rx="2" fill="#fff" /><path d="M12 2 q6 1 0 6" stroke="#fff" strokeWidth="2" fill="none" /><path d="M4 -4 q2 -3 4 0" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.7" /></g>
        </svg>
      );

    case "arcade":
      return (
        <svg className="vcard-scene" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={id("neon")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1a0b3a" /><stop offset="1" stopColor="#3a0f55" />
            </linearGradient>
            <linearGradient id={id("grid")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff2fb9" stopOpacity="0.9" /><stop offset="1" stopColor="#2ff0ff" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect width="300" height="150" fill={`url(#${id("neon")})`} />
          {/* synthwave floor */}
          {[104, 116, 130, 148].map((y, i) => <line key={i} x1="0" y1={y} x2="300" y2={y} stroke={`url(#${id("grid")})`} strokeWidth="1.6" />)}
          {[0, 60, 120, 180, 240, 300].map((x, i) => <line key={i} x1="150" y1="100" x2={x} y2="150" stroke="#2ff0ff" strokeWidth="1" opacity="0.5" />)}
          {/* sun */}
          <circle cx="150" cy="40" r="30" fill="#ff5fa8" opacity="0.5" />
          {/* big screen high-score */}
          <g transform="translate(168,20)">
            <rect x="0" y="0" width="118" height="64" rx="6" fill="#05030f" stroke="#2ff0ff" strokeWidth="2.5" />
            <rect x="0" y="0" width="118" height="64" rx="6" fill="none" stroke="#ff2fb9" strokeWidth="1" opacity="0.6" />
            <text x="59" y="18" fontSize="10" fontWeight={700} fill="#ffe24a" textAnchor="middle" fontFamily="'Courier New',monospace" letterSpacing="2">HI-SCORE</text>
            <Num n={n} x={59} y={42} size={30} fill="#2ff0ff" family="'Courier New',monospace" style={{ letterSpacing: "3px" }} />
          </g>
        </svg>
      );

    case "beach":
      return (
        <svg className="vcard-scene" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffb36a" /><stop offset="0.5" stopColor="#ff8fa3" /><stop offset="1" stopColor="#c76ba8" />
            </linearGradient>
            <radialGradient id={id("sun")} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0.75" stopColor="#fff2b0" /><stop offset="1" stopColor="#ffd25a" />
            </radialGradient>
          </defs>
          <rect width="300" height="150" fill={`url(#${id("sky")})`} />
          {/* sun holding the number */}
          <circle cx="210" cy="56" r="42" fill="#ffd25a" opacity="0.4" />
          <circle cx="210" cy="56" r="34" fill={`url(#${id("sun")})`} />
          <Num n={n} x={210} y={52} size={32} fill="#e0742a" />
          <text x={210} y={74} fontSize="7.5" fontWeight={700} fill="#e0742a" textAnchor="middle" fontFamily="'Segoe UI',sans-serif" letterSpacing="1">VILLAGERS</text>
          {/* sea + sand */}
          <path d="M0 104 L300 104 L300 120 L0 120 Z" fill="#4aa6c0" />
          <path d="M0 108 q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bfeaf2" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M0 118 L300 118 L300 150 L0 150 Z" fill="#f2d79a" />
          {/* palm */}
          <path d="M44 150 Q40 110 50 86" stroke="#6a4a2a" strokeWidth="5" fill="none" />
          <g stroke="#2f8a52" strokeWidth="6" fill="none" strokeLinecap="round">
            <path d="M50 86 Q30 72 12 78" /><path d="M50 86 Q34 66 40 48" /><path d="M50 86 Q70 70 88 76" /><path d="M50 86 Q66 66 62 48" />
          </g>
        </svg>
      );

    case "garden":
      return (
        <svg className="vcard-scene" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#bfe8ff" /><stop offset="1" stopColor="#e9f7d8" />
            </linearGradient>
          </defs>
          <rect width="300" height="150" fill={`url(#${id("sky")})`} />
          <circle cx="252" cy="30" r="18" fill="#ffe27a" />
          <path d="M-10 118 Q80 92 180 108 T320 104 L320 150 L-10 150 Z" fill="#8fd06a" />
          <path d="M-10 132 Q120 112 320 128 L320 150 L-10 150 Z" fill="#6fbf52" />
          {/* carved wooden sign holding the number */}
          <g transform="translate(176,40)">
            <rect x="26" y="52" width="7" height="46" fill="#7a5230" /><rect x="62" y="52" width="7" height="46" fill="#7a5230" />
            <rect x="0" y="14" width="96" height="44" rx="6" fill="#9c6b3e" stroke="#6a4420" strokeWidth="3" />
            <rect x="6" y="20" width="84" height="32" rx="3" fill="#b4824e" />
            <Num n={n} x={40} y={38} size={27} fill="#3a2410" />
            <text x={78} y={42} fontSize="20">🌱</text>
          </g>
          {/* sprouts */}
          {[30, 60, 92].map((x, i) => (
            <g key={i} transform={`translate(${x},126)`}><rect x="-1" y="0" width="2" height="12" fill="#3f8a44" /><circle cx="-4" cy="-1" r="3.5" fill="#ff9ec4" /><circle cx="4" cy="-1" r="3.5" fill="#ffd25a" /><circle cx="0" cy="-5" r="3.5" fill="#ff9ec4" /></g>
          ))}
        </svg>
      );

    case "cosmic":
    default:
      return (
        <svg className="vcard-scene" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={id("space")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1a1040" /><stop offset="0.5" stopColor="#3a1a6a" /><stop offset="1" stopColor="#120a2a" />
            </linearGradient>
            <radialGradient id={id("planet")} cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#8ad8ff" /><stop offset="0.6" stopColor="#5a8fe0" /><stop offset="1" stopColor="#2a3a8a" />
            </radialGradient>
          </defs>
          <rect width="300" height="150" fill={`url(#${id("space")})`} />
          {/* aurora */}
          <path d="M0 40 Q150 10 300 44 L300 70 Q150 44 0 74 Z" fill="#7affc8" opacity="0.14" />
          <path d="M0 60 Q150 34 300 66 L300 92 Q150 66 0 96 Z" fill="#ff8fe0" opacity="0.12" />
          {/* stars */}
          {[[24, 26], [70, 16], [120, 40], [50, 70], [280, 100], [20, 112], [262, 36], [100, 118], [150, 22]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1} fill="#fff" opacity={0.6 + (i % 4) * 0.1} />
          ))}
          {/* planet holding the number */}
          <g transform="translate(214,66)">
            <ellipse cx="0" cy="0" rx="58" ry="16" fill="none" stroke="#c9a8ff" strokeWidth="4" opacity="0.7" transform="rotate(-18)" />
            <circle r="38" fill={`url(#${id("planet")})`} />
            <ellipse cx="-10" cy="-10" rx="10" ry="6" fill="#bfeaff" opacity="0.3" />
            <Num n={n} x={0} y={-1} size={30} fill="#fff" style={{ filter: "drop-shadow(0 0 4px rgba(150,200,255,.9))" }} />
            <text x={0} y={19} fontSize="7" fontWeight={700} fill="#cfe4ff" textAnchor="middle" fontFamily="'Segoe UI',sans-serif" letterSpacing="1">VILLAGERS</text>
          </g>
        </svg>
      );
  }
}

/** The themed card scene with the villager number baked in. Character is layered on top by the caller. */
export function CardArt({ theme, villagers }: { theme: CardTheme; villagers: number }) {
  const uid = useId().replace(/[:]/g, "");
  return <Scene theme={theme} n={villagers} uid={uid} />;
}
