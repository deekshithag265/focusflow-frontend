import { useState, useEffect } from "react";
import useStore from "./store/useAppStore";
import { useTheme } from "./lib/useTheme";
import Header from "./components/Header";
import AuthPage from "./pages/AuthPage";
import TimerPage from "./pages/TimerPage";
import TasksPage from "./pages/TasksPage";
import AudioPage from "./pages/AudioPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";

const PAGES = {
  timer:     <TimerPage />,
  tasks:     <TasksPage />,
  audio:     <AudioPage />,
  analytics: <AnalyticsPage />,
  settings:  <SettingsPage />,
  admin:     <AdminPage />,
};

export default function App() {
  const { screen, tab, theme, accent, minimal, rehydrate } = useStore();
  const { c } = useTheme(theme, accent);
  const [fullscreen, setFullscreen] = useState(false);
  const [booting, setBooting]       = useState(true);

  useEffect(() => {
    // Try to restore login from stored token on first load
    rehydrate().finally(() => setBooting(false));

    history.replaceState({ screen: "login" }, "", "#login");
    const handlePop = (e) => {
      const s = e.state?.screen ?? "login";
      useStore.getState().setScreen(s);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const toggleFullscreen = () => {
    if (!fullscreen) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setFullscreen((f) => !f);
  };

  // Show nothing while checking stored token (avoids flash of login screen)
  if (booting) {
    return (
      <div style={{ minHeight: "100vh", background: "#111210", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#4A4640" }}>Loading…</div>
      </div>
    );
  }

  if (screen === "login" || screen === "register") return <AuthPage />;

  return (
    <div style={{ background: c.bg, color: c.text, minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Header onFullscreen={toggleFullscreen} />
      <main style={{ maxWidth: minimal ? "100%" : 1100, margin: "0 auto", padding: minimal ? 0 : "20px" }}>
        {PAGES[tab] || <TimerPage />}
      </main>
    </div>
  );
}