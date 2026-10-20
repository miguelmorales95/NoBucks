import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { Character } from "../character";

const VILLAGE_BG = `
<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky-top)"/><stop offset="1" stop-color="var(--sky-bot)"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#sky)"/>
<circle cx="338" cy="46" r="24" fill="#ffe08a" opacity=".85"/>
<ellipse cx="90" cy="60" rx="34" ry="16" fill="#ffffff" opacity=".5"/><ellipse cx="250" cy="42" rx="40" ry="18" fill="#ffffff" opacity=".45"/>
<path d="M0 150 Q200 120 400 150 L400 300 L0 300 Z" fill="var(--grass-dk)"/>
<path d="M0 172 Q200 148 400 172 L400 300 L0 300 Z" fill="var(--grass)"/>
<g><rect x="40" y="96" width="62" height="48" rx="6" fill="#e9c08a"/><path d="M34 98 L71 68 L108 98 Z" fill="#d98a5a"/><rect x="62" y="118" width="16" height="26" rx="2" fill="#9a6a3a"/><rect x="46" y="104" width="12" height="12" rx="2" fill="#bfe2e6"/></g>
<g><rect x="300" y="100" width="58" height="44" rx="6" fill="#cbdfe9"/><path d="M294 102 L329 74 L364 102 Z" fill="#8fb4c4"/><rect x="320" y="120" width="15" height="24" rx="2" fill="#6a8a9a"/></g>
<g><rect x="190" y="110" width="40" height="34" rx="5" fill="#f1ccd6"/><path d="M185 112 L210 90 L235 112 Z" fill="#d98aa6"/></g>
<g fill="var(--map-tree)"><circle cx="140" cy="128" r="17"/><circle cx="268" cy="150" r="15"/><circle cx="18" cy="150" r="16"/><circle cx="384" cy="156" r="16"/></g>
<rect x="136" y="140" width="8" height="14" fill="#8a6a3a"/><rect x="264" y="162" width="7" height="13" fill="#8a6a3a"/>
<path d="M150 300 Q210 220 210 180 Q210 220 290 300" fill="none" stroke="#e7dcc0" stroke-width="16" opacity=".7"/>
</svg>`;

interface Walker { el: HTMLElement; x: number; y: number; tx: number; ty: number; sp: number; pause: number; flip: number; ph: number; }

export function VillageScene() {
  const { state, actions } = useStore();
  const sceneRef = useRef<HTMLDivElement>(null);
  const villagers = state.village;

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
      w.el.style.left = w.x + "%";
      w.el.style.top = w.y + "%";
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
  }, [villagers.length]);

  return (
    <div className="vscene" ref={sceneRef}>
      <div className="vbg" dangerouslySetInnerHTML={{ __html: VILLAGE_BG }} />
      <div className="vplate">🍀 {state.player.name}’s village</div>
      {villagers.map((v, i) => (
        <button key={v.name + i} className="walker" aria-label={v.name}
          onClick={() => actions.openSheet({ kind: "villager", index: i })}>
          <Character look={v.char} />
        </button>
      ))}
      <button className="walker" aria-label="You" style={{ cursor: "default" }}>
        <span className="crown">👑</span>
        <Character look={state.player.char} />
      </button>
      <button className="addfab" onClick={() => actions.openSheet({ kind: "addVillager" })}>＋ Add villager</button>
    </div>
  );
}
