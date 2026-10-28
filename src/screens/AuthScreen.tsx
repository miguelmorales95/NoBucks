import { useState } from "react";
import { useStore } from "../store";

export function AuthScreen() {
  const { state } = useStore();
  return state.apiMode ? <EmailAuth /> : <DemoAuth />;
}

function DemoAuth() {
  const { actions } = useStore();
  return (
    <div className="gate auth" style={{ flex: 1 }}>
      <div className="logo">🌱</div>
      <h1>NoBucks</h1>
      <div className="tag">A neighborhood that runs on kindness, not cash.</div>
      <div className="scene">🏡 🌻 🍞 🎨 🧺 🌱</div>
      <div className="auth-btns">
        <button className="auth-btn" onClick={() => actions.signIn(false)}>
          <span className="lmark g">G</span><span className="txt">Continue with Google</span>
        </button>
        <button className="auth-btn" onClick={() => actions.signIn(false)}>
          <span className="lmark a"></span><span className="txt">Continue with Apple</span>
        </button>
        <button className="auth-btn" onClick={() => actions.signIn(false)}>
          <span className="lmark f">f</span><span className="txt">Continue with Facebook</span>
        </button>
        <div className="auth-or">or</div>
        <button className="auth-btn" onClick={() => actions.signIn(false)}>
          <span className="lmark m">✉</span><span className="txt">Continue with email</span>
        </button>
      </div>
      <button className="guest" onClick={() => actions.signIn(true)}>Just looking? Explore first →</button>
      <div className="legal">By continuing you agree to be a good neighbor — and to our Terms &amp; Community Guidelines. <button className="linkbtn" onClick={actions.openPrivacy}>How we handle your info</button></div>
    </div>
  );
}

function EmailAuth() {
  const { actions } = useStore();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">("register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const submit = () => {
    if (!email.trim() || password.length < 8 || (mode === "register" && !name.trim())) {
      actions.toast("Enter a name, email, and 8+ char password");
      return;
    }
    if (mode === "register" && !adult) { actions.toast("NoBucks is for people 18 and older"); return; }
    actions.apiAuth({ mode: mode === "register" ? "register" : "login", email: email.trim(), name: name.trim(), password, joinCode: joinCode.trim() });
  };

  if (mode === "forgot" || mode === "reset") {
    return (
      <div className="gate auth" style={{ flex: 1 }}>
        <div className="logo">🔑</div>
        <h1 style={{ fontSize: 28 }}>Reset your password</h1>
        <div className="auth-btns">
          <div className="field"><label>Email</label>
            <input type="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} /></div>
          {mode === "forgot" ? (
            <button className="btn btn-primary" onClick={async () => { if (await actions.forgotPassword(email.trim())) setMode("reset"); }}>Email me a code</button>
          ) : (
            <>
              <div className="field"><label>Code from the email</label>
                <input inputMode="numeric" value={code} maxLength={6} placeholder="123456" onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></div>
              <div className="field"><label>New password</label>
                <input type="password" value={password} placeholder="At least 8 characters" onChange={(e) => setPassword(e.target.value)} /></div>
              <button className="btn btn-primary" disabled={code.length !== 6 || password.length < 8}
                onClick={() => actions.resetPassword(email.trim(), code, password)}>Change password</button>
            </>
          )}
        </div>
        <button className="guest" onClick={() => setMode("login")}>← Back to sign in</button>
      </div>
    );
  }

  return (
    <div className="gate auth" style={{ flex: 1 }}>
      <div className="logo">🌱</div>
      <h1>NoBucks</h1>
      <div className="tag">A neighborhood that runs on kindness, not cash.</div>
      <div className="auth-btns">
        <div className="seg" style={{ marginBottom: 4 }}>
          <button aria-pressed={mode === "register"} onClick={() => setMode("register")}>Create account</button>
          <button aria-pressed={mode === "login"} onClick={() => setMode("login")}>Sign in</button>
        </div>
        {mode === "register" && (
          <div className="field"><label>Your name</label>
            <input value={name} maxLength={40} placeholder="What should neighbors call you?" onChange={(e) => setName(e.target.value)} /></div>
        )}
        <div className="field"><label>Email</label>
          <input type="email" value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Password</label>
          <input type="password" value={password} placeholder="At least 8 characters" onChange={(e) => setPassword(e.target.value)} /></div>
        {mode === "register" && (
          <div className="field"><label>Neighborhood code (optional)</label>
            <input value={joinCode} maxLength={12} placeholder="From your organizer, like K7Q2XA" autoCapitalize="characters"
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())} /></div>
        )}
        {mode === "register" && (
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, textAlign: "left" }}>
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} style={{ marginTop: 3 }} />
            <span>I'm 18 or older. NoBucks is for adults, because neighbors meet in person to trade help.</span>
          </label>
        )}
        {mode === "login" && <button className="linkbtn" onClick={() => setMode("forgot")}>Forgot your password?</button>}
        <button className="btn btn-primary" onClick={submit}>{mode === "register" ? "Create account 🌱" : "Sign in"}</button>
      </div>
      <button className="guest" onClick={() => actions.signIn(true)}>Just looking? Explore in demo mode →</button>
      <div className="legal">Social sign-in (Google / Apple / Facebook) runs through Amazon Cognito once configured. <button className="linkbtn" onClick={actions.openPrivacy}>Privacy policy</button></div>
    </div>
  );
}
