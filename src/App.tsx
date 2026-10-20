import type { ReactNode } from "react";
import { useStore } from "./store";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { SheetHost } from "./components/SheetHost";
import { Toast } from "./components/Toast";
import { AuthScreen } from "./screens/AuthScreen";
import { VerifyScreen } from "./screens/VerifyScreen";
import { CreateScreen } from "./screens/CreateScreen";
import { VillageScreen } from "./screens/VillageScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { PostScreen } from "./screens/PostScreen";
import { PactsScreen } from "./screens/PactsScreen";
import { ChatsScreen } from "./screens/ChatsScreen";

function TabScreen() {
  const { state } = useStore();
  switch (state.tab) {
    case "village": return <VillageScreen />;
    case "explore": return <ExploreScreen />;
    case "post": return <PostScreen />;
    case "pacts": return <PactsScreen />;
    case "chats": return <ChatsScreen />;
  }
}

export function App() {
  const { state } = useStore();

  let body: ReactNode;
  if (state.stage === "auth") body = <AuthScreen />;
  else if (state.stage === "verify") body = <VerifyScreen />;
  else if (state.stage === "create") body = <CreateScreen />;
  else body = (
    <>
      <Header />
      <main className="screen"><TabScreen /></main>
      <BottomNav />
    </>
  );

  return (
    <div className="app">
      {body}
      <SheetHost />
      <Toast />
    </div>
  );
}
