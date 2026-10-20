import { useEffect, useState } from "react";
import { useStore } from "../store";

export function Toast() {
  const { state } = useStore();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!state.toastKey) return;
    setShown(true);
    const id = window.setTimeout(() => setShown(false), 2500);
    return () => window.clearTimeout(id);
  }, [state.toastKey]);

  return <div className={"toast" + (shown ? " show" : "")}>{state.toastMsg}</div>;
}
