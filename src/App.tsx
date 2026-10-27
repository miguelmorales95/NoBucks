import { useEffect, type ReactNode } from "react";
import { useStore } from "./store";
import type { Weather } from "./types";
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
import { AdminScreen } from "./screens/AdminScreen";
import { PrivacyScreen } from "./screens/PrivacyScreen";

function TabScreen() {
  const { state } = useStore();
  if (state.adminOpen) return <AdminScreen />;
  switch (state.tab) {
    case "village": return <VillageScreen />;
    case "explore": return <ExploreScreen />;
    case "post": return <PostScreen />;
    case "pacts": return <PactsScreen />;
    case "chats": return <ChatsScreen />;
  }
}

export function App() {
  const { state, actions } = useStore();

  // Mirror the viewer's real season + weather into the village.
  useEffect(() => {
    const month = new Date().getMonth();
    const season: Weather["season"] = month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "fall" : "winter";
    const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
    const condLabel = (c: string) => (c === "rain" ? "rainy" : c === "snow" ? "snowy" : c === "clouds" ? "cloudy" : "clear");
    const fallback = () => actions.setWeather({ season, condition: "clear", label: `${cap(season)} · clear` });
    if (!("geolocation" in navigator)) { fallback(); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,temperature_2m`);
          const d = await r.json();
          const code: number = d.current?.weather_code ?? 0;
          const condition: Weather["condition"] =
            code <= 1 ? "clear" : code <= 48 ? "clouds" : (code >= 71 && code <= 77) || code === 85 || code === 86 ? "snow" : "rain";
          const t = Math.round(d.current?.temperature_2m);
          actions.setWeather({ season, condition, label: `${cap(season)} · ${condLabel(condition)}${Number.isNaN(t) ? "" : ` · ${t}°`}` });
        } catch { fallback(); }
      },
      () => fallback(),
      { timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let body: ReactNode;
  // The privacy policy is reachable from every stage, including before sign-in.
  if (state.privacyOpen) body = <main className="screen"><PrivacyScreen /></main>;
  else if (state.stage === "auth") body = <AuthScreen />;
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
