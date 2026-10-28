import { useState } from "react";
import { useStore } from "../store";

const METHODS = [
  { id: "in-person", label: "Met them in person" },
  { id: "known-neighbor", label: "I already know them" },
  { id: "vouched", label: "Two members vouched" },
] as const;

/** At a meetup: the neighbor says the email they signed up with, and the leader confirms them. */
function VerifyNeighbor() {
  const { state, actions } = useStore();
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("in-person");
  if (!state.apiMode) return null;
  return (
    <>
      <div className="section-h">🤝 Verify a neighbor{state.adminOverview?.unverified ? ` (${state.adminOverview.unverified} waiting)` : ""}</div>
      <div className="repcard">
        <div className="repdetails" style={{ marginBottom: 8 }}>Ask for the email they signed up with. Verifying also adds them to your neighborhood.</div>
        <div className="field"><label>Their email</label>
          <input type="email" value={email} placeholder="neighbor@example.com" onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="seg" style={{ margin: "8px 0" }}>
          {METHODS.map((m) => <button key={m.id} aria-pressed={method === m.id} onClick={() => setMethod(m.id)}>{m.label}</button>)}
        </div>
        <button className="btn btn-primary" disabled={!/\S+@\S+\.\S+/.test(email)}
          onClick={async () => { if (await actions.verifyNeighbor(email.trim(), method)) setEmail(""); }}>Verify</button>
      </div>
    </>
  );
}

export function AdminScreen() {
  const { state, actions } = useStore();
  const ov = state.adminOverview;
  const stats = {
    neighborhood: ov?.neighborhood ?? state.player.neighborhood,
    members: ov?.members ?? 26,
    listings: ov?.listings ?? state.items.length,
    events: ov?.events ?? state.events.length,
    pot: ov?.pot ?? state.communityPot,
  };

  return (
    <>
      <div className="chat-head">
        <button className="back" onClick={actions.closeAdmin}>←</button>
        <div className="ti"><b>🛡️ Community tools</b><span>{stats.neighborhood}</span></div>
      </div>

      <div className="vmeta">
        <div className="vm"><div className="num">{stats.members}</div><div className="lab">Members</div></div>
        <div className="vm"><div className="num">{stats.listings}</div><div className="lab">Listings</div></div>
        <div className="vm"><div className="num">{stats.events}</div><div className="lab">Events</div></div>
      </div>
      <div className="vmeta" style={{ marginTop: 0 }}>
        <div className="vm"><div className="num">{stats.pot} 🌱</div><div className="lab">Community pot</div></div>
        <div className="vm"><div className="num">{state.reports.length}</div><div className="lab">Open reports</div></div>
      </div>

      <VerifyNeighbor />

      <div className="section-h">🚩 Reports to review</div>
      {state.reports.length ? (
        <div className="feed">
          {state.reports.map((r) => (
            <div className="repcard" key={r.id}>
              <div className="rephead"><b>{r.reporterName}</b> reported <b>{r.targetName}</b></div>
              <div className="repreason">{r.reason}</div>
              {r.details && <div className="repdetails">“{r.details}”</div>}
              <div className="repactions">
                <button className="btn btn-ghost" onClick={() => actions.resolveReport(r.id, "reviewed")}>Mark reviewed</button>
                <button className="btn btn-primary" onClick={() => actions.resolveReport(r.id, "actioned")}>Take action</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty"><span className="e">✅</span>No open reports — the neighborhood’s in good shape.</div>
      )}
    </>
  );
}
