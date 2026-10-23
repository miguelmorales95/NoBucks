import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { Character } from "../character";
import type { CharacterLook, Villager, Weather } from "../types";

const DEFS = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky-top)"/><stop offset="1" stop-color="var(--sky-bot)"/></linearGradient></defs>`;
const SKY_GROUND = `<rect width="400" height="300" fill="url(#sky)"/><circle cx="338" cy="46" r="24" fill="#ffe08a" opacity=".85"/><ellipse cx="90" cy="60" rx="34" ry="16" fill="#ffffff" opacity=".5"/><ellipse cx="250" cy="42" rx="40" ry="18" fill="#ffffff" opacity=".45"/><path d="M0 150 Q200 120 400 150 L400 300 L0 300 Z" fill="var(--grass-dk)"/><path d="M0 172 Q200 148 400 172 L400 300 L0 300 Z" fill="var(--grass)"/>`;
const PATH = `<path d="M150 300 Q210 220 210 180 Q210 220 290 300" fill="none" stroke="#e7dcc0" stroke-width="16" opacity=".55"/>`;

function themeMid(theme: string): string {
  if (theme === "farm")
    return `<g><rect x="40" y="92" width="74" height="52" rx="4" fill="#c0503e"/><path d="M34 94 L77 64 L120 94 Z" fill="#a03828"/><rect x="66" y="116" width="22" height="28" fill="#7a2e22"/><path d="M66 116 L88 116 M77 116 L77 144 M66 130 L88 130" stroke="#5a2016" stroke-width="2"/></g><g stroke="#caa36a" stroke-width="3"><line x1="150" y1="150" x2="150" y2="168"/><line x1="180" y1="150" x2="180" y2="168"/><line x1="210" y1="150" x2="210" y2="168"/><line x1="140" y1="158" x2="220" y2="158"/></g><g fill="#e8c86a"><ellipse cx="300" cy="150" rx="22" ry="14"/><ellipse cx="340" cy="156" rx="18" ry="12"/></g><g fill="var(--map-tree)"><circle cx="18" cy="140" r="14"/></g>`;
  if (theme === "pirate")
    return `<rect x="0" y="150" width="400" height="150" fill="#2f6f8f"/><path d="M0 150 Q100 142 200 150 T400 150 L400 172 L0 172 Z" fill="#3b84a8"/><g><rect x="150" y="104" width="100" height="40" rx="6" fill="#7a4a24"/><path d="M150 144 L160 164 L240 164 L250 144 Z" fill="#8a5a2c"/><rect x="196" y="40" width="4" height="66" fill="#5a3a1c"/><path d="M200 48 L240 60 L200 78 Z" fill="#f3efe2"/><path d="M200 82 L234 92 L200 106 Z" fill="#f3efe2"/></g><g fill="#2e7d5a"><path d="M40 150 q-6 -30 6 -44 q12 14 6 44z"/></g>`;
  if (theme === "sports")
    return `<rect x="20" y="150" width="360" height="130" fill="#4e9c5a" opacity=".5"/><g stroke="#fff" stroke-width="2" opacity=".7" fill="none"><rect x="30" y="156" width="340" height="120"/><line x1="200" y1="156" x2="200" y2="276"/><circle cx="200" cy="216" r="26"/></g><g><rect x="150" y="96" width="100" height="40" fill="#c9d3dc" opacity=".6"/><path d="M150 96 L250 96 L250 86 L150 86 Z" fill="#9aa7b2"/></g><circle cx="110" cy="250" r="10" fill="#fff" stroke="#222" stroke-width="2"/>`;
  if (theme === "office")
    return `<g><rect x="40" y="70" width="70" height="74" fill="#9fb3c4"/><rect x="300" y="84" width="64" height="60" fill="#b4c2cf"/><g fill="#dfe9f0"><rect x="48" y="78" width="14" height="14"/><rect x="68" y="78" width="14" height="14"/><rect x="88" y="78" width="14" height="14"/><rect x="48" y="98" width="14" height="14"/><rect x="68" y="98" width="14" height="14"/><rect x="88" y="98" width="14" height="14"/><rect x="48" y="118" width="14" height="14"/><rect x="68" y="118" width="14" height="14"/><rect x="88" y="118" width="14" height="14"/></g><g fill="#e4eef4"><rect x="308" y="92" width="12" height="12"/><rect x="326" y="92" width="12" height="12"/><rect x="344" y="92" width="12" height="12"/><rect x="308" y="110" width="12" height="12"/><rect x="326" y="110" width="12" height="12"/><rect x="344" y="110" width="12" height="12"/></g></g><g fill="var(--map-tree)"><circle cx="200" cy="138" r="15"/></g>`;
  return `<g><rect x="40" y="96" width="62" height="48" rx="6" fill="#e9c08a"/><path d="M34 98 L71 68 L108 98 Z" fill="#d98a5a"/><rect x="62" y="118" width="16" height="26" rx="2" fill="#9a6a3a"/><rect x="46" y="104" width="12" height="12" rx="2" fill="#bfe2e6"/></g><g><rect x="300" y="100" width="58" height="44" rx="6" fill="#cbdfe9"/><path d="M294 102 L329 74 L364 102 Z" fill="#8fb4c4"/><rect x="320" y="120" width="15" height="24" rx="2" fill="#6a8a9a"/></g><g><rect x="190" y="110" width="40" height="34" rx="5" fill="#f1ccd6"/><path d="M185 112 L210 90 L235 112 Z" fill="#d98aa6"/></g><g fill="var(--map-tree)"><circle cx="140" cy="128" r="17"/><circle cx="268" cy="150" r="15"/><circle cx="18" cy="150" r="16"/><circle cx="384" cy="156" r="16"/></g>`;
}
function bgFor(theme: string): string {
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${DEFS}${SKY_GROUND}${themeMid(theme)}${PATH}</svg>`;
}

function WeatherLayer({ weather }: { weather: Weather | null }) {
  if (!weather) return null;
  const n = weather.condition === "rain" ? 44 : weather.condition === "snow" ? 30 : 0;
  const parts = Array.from({ length: n }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const dur = weather.condition === "snow" ? 3 + Math.random() * 3 : 0.5 + Math.random() * 0.5;
    const cls = weather.condition === "rain" ? "wx-drop" : "wx-flake";
    return <span key={i} className={cls} style={{ left: left + "%", animationDelay: delay + "s", animationDuration: dur + "s" }}>{weather.condition === "snow" ? "❄" : ""}</span>;
  });
  return (
    <div className={`wx wx-${weather.condition} season-${weather.season}`} aria-hidden="true">
      {weather.condition === "clouds" && (
        <>
          <span className="wx-cloud" style={{ top: "12%" }}>☁️</span>
          <span className="wx-cloud" style={{ top: "28%", animationDelay: "7s" }}>☁️</span>
        </>
      )}
      {parts}
    </div>
  );
}

interface Walker { el: HTMLElement; x: number; y: number; tx: number; ty: number; sp: number; pause: number; flip: number; ph: number; }

export function VillageScene(
  { villagers, playerChar, plateName, theme }: { villagers?: Villager[]; playerChar?: CharacterLook; plateName?: string; theme?: string } = {}
) {
  const { state, actions } = useStore();
  const sceneRef = useRef<HTMLDivElement>(null);
  const vgs = villagers ?? state.village;
  const pchar = playerChar ?? state.player.char;
  const plate = plateName ?? `${state.player.name}'s village`;
  const bgTheme = theme ?? state.player.villageTheme;
  const interactive = !villagers;

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const nodes = Array.from(scene.querySelectorAll<HTMLElement>(".walker"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W: Walker[] = nodes.map((el) => {
      const x = 10 + Math.random() * 80, y = 58 + Math.random() * 30;
      return { el, x, y, tx: x, ty: y, sp: 2.2 + Math.random() * 2.2, pause: Math.random() * 2.5, flip: 1, ph: Math.random() * 6 };
    });
    const paint = (w: Walker, bob: number) => {
      w.el.style.left = w.x + "%"; w.el.style.top = w.y + "%";
      w.el.style.transform = `translate(-50%,-100%) translateY(${-bob}px) scaleX(${w.flip})`;
      w.el.style.zIndex = String(Math.round(w.y));
    };
    W.forEach((w) => paint(w, 0));
    if (reduce) return;
    let last = 0, raf = 0;
    const tick = (ts: number) => {
      if (!last) last = ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      W.forEach((w) => {
        if (w.pause > 0) { w.pause -= dt; }
        else {
          const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
          if (d < 1.2) { w.tx = 8 + Math.random() * 84; w.ty = 56 + Math.random() * 32; w.pause = 0.6 + Math.random() * 3; }
          else { const step = w.sp * dt; w.x += (dx / d) * step; w.y += (dy / d) * step; w.flip = dx < 0 ? -1 : 1; }
        }
        w.ph += dt * 9;
        paint(w, w.pause > 0 ? 0 : Math.abs(Math.sin(w.ph)) * 2.2);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [vgs.length, bgTheme]);

  return (
    <div className="vscene" ref={sceneRef}>
      <div className="vbg" dangerouslySetInnerHTML={{ __html: bgFor(bgTheme) }} />
      <WeatherLayer weather={state.weather} />
      <div className="vplate">🌱 {plate}</div>
      {vgs.map((v, i) => (
        <button key={v.name + i} className={"walker" + (v.trust ? " t-" + v.trust : "")} aria-label={v.name}
          onClick={interactive ? () => actions.openSheet({ kind: "villager", index: i }) : undefined}>
          <Character look={v.char} />
        </button>
      ))}
      <button className="walker t-green" aria-label="You" style={{ cursor: "default" }}>
        <span className="crown">👑</span>
        <Character look={pchar} />
      </button>
      {interactive && <button className="addfab" onClick={() => actions.openSheet({ kind: "addVillager" })}>＋ Add villager</button>}
    </div>
  );
}
