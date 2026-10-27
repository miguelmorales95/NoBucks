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
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    if (!email.trim() || password.length < 8 || (mode === "register" && !name.trim())) {
      actions.toast("Enter a name, email, and 8+ char password");
      return;
    }
    actions.apiAuth({ mode, email: email.trim(), name: name.trim(), password });
  };

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
        <button className="btn btn-primary" onClick={submit}>{mode === "register" ? "Create account 🌱" : "Sign in"}</button>
      </div>
      <button className="guest" onClick={() => actions.signIn(true)}>Just looking? Explore in demo mode →</button>
      <div className="legal">Social sign-in (Google / Apple / Facebook) runs through Amazon Cognito once configured. <button className="linkbtn" onClick={actions.openPrivacy}>Privacy policy</button></div>
    </div>
  );
}
