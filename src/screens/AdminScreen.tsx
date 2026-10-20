import { useStore } from "../store";

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
