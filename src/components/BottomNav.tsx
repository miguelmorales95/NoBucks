import { useStore } from "../store";
import { Character } from "../character";
import type { Tab } from "../types";

const TABS: { tab: Tab; label: string; icon?: string }[] = [
  { tab: "village", label: "Village" },
  { tab: "explore", label: "Explore", icon: "🧭" },
  { tab: "post", label: "Post", icon: "+" },
  { tab: "pacts", label: "Gather", icon: "🎉" },
  { tab: "chats", label: "Chats", icon: "💬" },
];

export function BottomNav() {
  const { state, actions } = useStore();
  return (
    <nav className="nav">
      {TABS.map((t) => (
        <button
          key={t.tab}
          className={t.tab === "post" ? "post-btn" : undefined}
          aria-pressed={state.tab === t.tab}
          onClick={() => actions.setTab(t.tab)}
        >
          <span className="ico">
            {t.tab === "village"
              ? <span className="vico"><Character look={state.player.char} /></span>
              : t.icon}
          </span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
