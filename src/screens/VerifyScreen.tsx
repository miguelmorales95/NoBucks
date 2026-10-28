import { useStore } from "../store";

// Verification is done in person by a community leader (at a meetup, or someone they already
// know). This step explains that honestly instead of pretending to check anything.
export function VerifyScreen() {
  const { actions } = useStore();
  return (
    <div className="gate" style={{ flex: 1 }}>
      <div className="logo" style={{ fontSize: 36 }}>🛡️</div>
      <h1 style={{ fontSize: 28 }}>Getting verified</h1>
      <div className="tag">Neighbors trust each other more when they know someone has met you.</div>
      <div className="vbox">
        A community leader verifies you in person: at a neighborhood meetup, or if they already know you.
        Tell them the email you signed up with and they’ll confirm you. No ID scans, selfies or documents.
      </div>
      <div className="vbox">Until then you can look around, post and trade; your card just shows you’re not verified yet.</div>
      <div className="auth-btns">
        <button className="btn btn-primary" onClick={() => actions.verify("pending")}>Got it, continue →</button>
      </div>
    </div>
  );
}
