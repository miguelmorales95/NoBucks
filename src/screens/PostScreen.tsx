import { useState, type ChangeEvent } from "react";
import { useStore } from "../store";
import { CATS, CAT_KEYS } from "../data";
import type { Cat, PostType } from "../types";

const TYPE_LABEL: Record<PostType, string> = {
  offer: "share something or a skill",
  request: "ask for help or a thing you need",
  pact: "start a standing weekly swap",
};
const PLACEHOLDER: Record<PostType, string> = {
  offer: "e.g. Homemade tamales, a dozen",
  request: "e.g. Need help assembling a crib",
  pact: "e.g. Morning dog-walk ↔ evening plant-watering",
};

export function PostScreen() {
  const { actions } = useStore();
  const [type, setType] = useState<PostType>("offer");
  const [cat, setCat] = useState<Cat>("food");
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [cost, setCost] = useState(3);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const showCost = type !== "pact";

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result));
    r.readAsDataURL(f);
  };

  const submit = () => {
    if (!title.trim()) { actions.toast("Give your post a title first ✏️"); return; }
    actions.post({ type, cat, title: title.trim(), blurb: blurb.trim(), cost: type === "pact" ? "pact" : cost, photo });
  };

  return (
    <>
      <div className="screen-title">Post to the neighborhood</div>
      <div className="screen-sub">Takes a minute. You can edit or take it down any time.</div>
      <div className="seg">
        {(["offer", "request", "pact"] as PostType[]).map((t) => (
          <button key={t} aria-pressed={type === t} onClick={() => setType(t)}>
            {t === "offer" ? "🎁 Offer" : t === "request" ? "🙋 Request" : "🤝 Pact"}
          </button>
        ))}
      </div>
      <div className="field">
        <label>I want to {TYPE_LABEL[type]}</label>
        <input value={title} maxLength={70} placeholder={PLACEHOLDER[type]} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label>Photo (optional)</label>
        {photo ? (
          <div className="photoedit">
            <img src={photo} alt="preview" />
            <button className="opt2" onClick={() => setPhoto(undefined)}>Remove photo</button>
          </div>
        ) : (
          <label className="photoadd">
            📷 Add a photo
            <input type="file" accept="image/*" hidden onChange={onPhoto} />
          </label>
        )}
      </div>
      <div className="field">
        <label>Category</label>
        <div className="catgrid">
          {CAT_KEYS.map((k) => (
            <div key={k} className="opt" role="button" tabIndex={0} aria-pressed={cat === k} onClick={() => setCat(k)}>
              <span className="e">{CATS[k].e}</span>{CATS[k].label}
            </div>
          ))}
        </div>
      </div>
      <div className="field">
        <label>A little more</label>
        <textarea value={blurb} placeholder="When you’re free, what to expect, anything that helps a neighbor say yes." onChange={(e) => setBlurb(e.target.value)} />
      </div>
      {showCost ? (
        <div className="field">
          <label>{type === "request" ? "Sprouts you’ll give" : "Sprouts you’d like"} <span style={{ fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>(≈ 1 per hour — or free)</span></label>
          <div className="steps">
            <button onClick={() => setCost(Math.max(0, cost - 1))}>–</button>
            <div className="v">{cost === 0 ? "Free" : cost + " 🌱"}</div>
            <button onClick={() => setCost(Math.min(12, cost + 1))}>+</button>
          </div>
        </div>
      ) : (
        <div className="field">
          <label>How it works</label>
          <div style={{ background: "var(--surface-2)", borderRadius: 14, padding: 13, color: "var(--muted)", fontSize: 13.5 }}>
            Pacts are even swaps — no sprouts change hands. Describe what each side does and how often.
          </div>
        </div>
      )}
      <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={submit}>🌱 Post it</button>
    </>
  );
}
