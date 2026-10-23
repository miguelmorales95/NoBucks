import { useState } from "react";
import { useStore } from "../store";

const METHODS = [
  { icon: "🪪", title: "Photo ID", sub: "Any government, consular, or foreign ID" },
  { icon: "🤳", title: "Quick selfie check", sub: "No documents needed at all" },
  { icon: "🤝", title: "Get vouched", sub: "Have two NoBucks members confirm you" },
  { icon: "📱", title: "Phone + address", sub: "A simple reachable-and-local check" },
];

export function VerifyScreen() {
  const { actions } = useStore();
  const [checking, setChecking] = useState(false);

  if (checking) {
    return (
      <div className="gate" style={{ flex: 1, justifyContent: "center", textAlign: "center" }}>
        <div className="spinner" />
        <h1 style={{ fontSize: 24 }}>Checking…</h1>
        <div className="tag">Confirming you’re a real neighbor. This only takes a moment.</div>
      </div>
    );
  }

  const start = (method: string) => { setChecking(true); window.setTimeout(() => actions.verify(method), 1400); };

  return (
    <div className="gate" style={{ flex: 1 }}>
      <div className="logo" style={{ fontSize: 36 }}>🛡️</div>
      <h1 style={{ fontSize: 28 }}>Verify you’re a real neighbor</h1>
      <div className="tag">One quick check keeps bots and scammers out. We’re confirming you’re a real human — not your paperwork.</div>
      <div className="vbox">Any one of these works. We accept consular IDs and foreign passports, or no document at all. Pick whatever is easiest for you.</div>
      <div className="auth-btns">
        {METHODS.map((m) => (
          <button key={m.title} className="auth-btn" onClick={() => start(m.title)}>
            <span className="lmark v">{m.icon}</span>
            <span className="txt">{m.title}<span className="sub">{m.sub}</span></span>
          </button>
        ))}
      </div>
      <div className="legal">Your ID is used only to confirm you’re real, then deleted. It is never shown to other neighbors.</div>
    </div>
  );
}
