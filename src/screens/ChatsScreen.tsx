import { useState, type ReactNode } from "react";
import { useStore, firstName } from "../store";
import { Avatar } from "../components/listing";
import { CATS } from "../data";
import type { Thread } from "../types";

export function ChatsScreen() {
  const { state } = useStore();
  if (state.chatOpen != null) {
    const t = state.threads.find((th) => th.id === state.chatOpen);
    if (t) return <ThreadView thread={t} />;
  }
  return <ThreadList />;
}

function ThreadList() {
  const { state, actions } = useStore();
  if (!state.threads.length) {
    return (
      <>
        <div className="screen-title">Chats 💬</div>
        <div className="empty"><span className="e">🍃</span>No conversations yet. Message a neighbor from a listing to arrange a trade.</div>
      </>
    );
  }
  return (
    <>
      <div className="screen-title">Chats 💬</div>
      <div className="screen-sub">Arrange your trades here. A trade’s status rides along the top of each chat.</div>
      {state.threads.map((t) => {
        const last = t.msgs[t.msgs.length - 1];
        return (
          <div className="trow" key={t.id} onClick={() => actions.openThread(t.id)}>
            <Avatar name={t.name} cat={t.cat} />
            <div className="body">
              <b>{firstName(t.name)}</b>
              <span>{last.from === "me" ? "You: " : ""}{last.text}</span>
            </div>
            <span className={"tstat " + t.status}>{t.status}</span>
          </div>
        );
      })}
    </>
  );
}

function ThreadView({ thread }: { thread: Thread }) {
  const { state, actions } = useStore();
  const [text, setText] = useState("");
  const item = state.items.find((i) => i.id === thread.itemId);
  const numericCost = item && typeof item.cost === "number" ? item.cost : null;
  const ctxCost = item
    ? item.cost === "barter" ? "Barter" : item.cost === "pact" ? "Weekly pact" : numericCost != null ? numericCost + " 🌱" : ""
    : "";

  const send = () => { if (text.trim()) { actions.sendMsg(thread.id, text); setText(""); } };

  let action: ReactNode;
  if (thread.status === "arranging") {
    if (thread.role === "client") {
      action = numericCost != null
        ? <button className="btn btn-primary" onClick={() => item && actions.openSheet({ kind: "confirm", id: item.id })}>🌱 Reserve {numericCost} 🌱 &amp; lock it in</button>
        : <button className="btn btn-primary" onClick={() => item && actions.reserve(item)}>🔁 Agree to the barter</button>;
    } else if (thread.role === "provider") {
      action = <button className="btn btn-teal" onClick={() => actions.completeTrade(thread.id)}>✅ Mark complete &amp; earn{numericCost != null ? ` ${numericCost} 🌱` : ""}</button>;
    } else {
      action = <button className="btn btn-teal" onClick={() => actions.completeTrade(thread.id)}>🤝 Confirm the pact</button>;
    }
  } else if (thread.status === "reserved") {
    action = <button className="btn btn-teal" onClick={() => actions.completeTrade(thread.id)}>✅ Mark complete &amp; rate</button>;
  } else {
    action = <div style={{ textAlign: "center", color: "var(--good)", fontWeight: 800, fontSize: 13, padding: 4 }}>✓ Trade complete</div>;
  }

  return (
    <>
      <div className="chat-head">
        <button className="back" onClick={actions.closeThread}>←</button>
        <Avatar name={thread.name} cat={thread.cat} />
        <div className="ti"><b>{firstName(thread.name)}</b><span>{CATS[thread.cat].e} {CATS[thread.cat].label}</span></div>
        <span className={"tstat " + thread.status}>{thread.status}</span>
      </div>
      <div className="ctx">💬 About: {item?.title ?? "a trade"}{ctxCost ? ` · ${ctxCost}` : ""}</div>
      <div className="bubbles">
        {thread.msgs.map((m, i) => (
          <div key={i} className={"bub " + (m.from === "sys" ? "sys" : m.from === "me" ? "me" : "them")}>{m.text}</div>
        ))}
      </div>
      <div className="chat-act">{action}</div>
      <div className="chat-input">
        <textarea
          value={text} rows={1} placeholder={`Message ${firstName(thread.name)}…`}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="send" onClick={send}>➤</button>
      </div>
    </>
  );
}
