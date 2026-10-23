import { useState } from "react";
import { useStore } from "../store";
import { Character } from "../character";
import { CharacterBuilder } from "../components/CharacterBuilder";

export function CreateScreen() {
  const { state, actions } = useStore();
  const [name, setName] = useState(state.player.name);

  return (
    <div className="screen" style={{ flex: 1 }}>
      <div style={{ textAlign: "center", paddingTop: 6 }}>
        <div className="screen-title" style={{ fontSize: 24 }}>Create your villager 🌱</div>
        <div className="screen-sub">Be a person or an animal. This is how neighbors see you — and who lives in your village.</div>
      </div>
      <div className="charprev"><Character look={state.draft} /></div>
      <div style={{ textAlign: "center", margin: "10px 0 16px" }}>
        <button className="opt2" onClick={actions.shuffleDraft}>🎲 Surprise me</button>
      </div>
      <div className="field">
        <label>Your name</label>
        <input value={name} maxLength={24} placeholder="What should neighbors call you?" onChange={(e) => setName(e.target.value)} />
      </div>
      <CharacterBuilder look={state.draft} onChange={actions.setDraft} wardrobe={state.wardrobe} />
      <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={() => actions.finishCreate(name)}>Enter NoBucks 🌱</button>
      <button className="btn btn-ghost" style={{ marginTop: 9 }} onClick={() => actions.finishCreate(name)}>Skip for now</button>
    </div>
  );
}
