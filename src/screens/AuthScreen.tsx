import { useStore } from "../store";

export function AuthScreen() {
  const { actions } = useStore();
  return (
    <div className="gate auth" style={{ flex: 1 }}>
      <div className="logo">🍀</div>
      <h1>Clover</h1>
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
      <div className="legal">By continuing you agree to be a good neighbor — and to our Terms &amp; Community Guidelines.</div>
    </div>
  );
}
