import { useStore } from "../store";
import { Character } from "../character";

export function Header() {
  const { state, actions } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <header className="top">
      <div className="brand">🌱 nobucks</div>
      <div className="hi">
        <div className="me t-green"><Character look={state.player.char} /></div>
        <div className="who">
          <div className="k">Good afternoon,</div>
          <div className="n">{state.player.name}</div>
        </div>
        <button className="bell" aria-label="Notifications" onClick={() => actions.openSheet({ kind: "notifications" })}>
          🔔{unread > 0 && <span className="nbadge">{unread}</span>}
        </button>
        <button className="wallet" onClick={() => actions.setTab("village")}>
          <span>🌱</span><span>{state.balance}</span>
        </button>
      </div>
      <div className="loc">📍 {state.player.neighborhood}, LA — <strong style={{ marginLeft: 4 }}>your home neighborhood</strong></div>
    </header>
  );
}
