import useStore from "../store/useAppStore";
import { useTheme } from "../lib/useTheme";
 
const TABS = ["timer", "tasks", "audio", "analytics", "settings"];
 
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
 
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
 
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
 
const MaximizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
    <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
  </svg>
);
 
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
 
export default function Header({ onFullscreen }) {
  const { theme, accent, tab, minimal, streak, user, setTab, setMinimal, setTheme, logout } = useStore();
  const { c, ac, btn } = useTheme(theme, accent);
  const dark = theme === "dark";
 
  // Replace the minimal mode return block:
if (minimal) {
  return (
    <button onClick={() => setMinimal(false)} title="Back to full view" style={{
      position: "fixed", top: 12, right: 12, zIndex: 100,
      width: 32, height: 32, borderRadius: 8, border: "none",
      background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
      color: dark ? "#E8E4DC" : "#1A1614",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    </button>
  );
}
 
  const tabs = user?.role === "admin" ? [...TABS, "admin"] : TABS;
 
  const iconBtn = {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    color: dark ? "#E8E4DC" : "#1A1614",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
 
  const logoutBtn = {
    ...iconBtn,
    background: dark ? "rgba(192,57,43,0.18)" : "rgba(192,57,43,0.10)",
    color: "#C0392B",
  };
 
  return (
    <header style={{ background: c.card, borderBottom: `0.5px solid ${c.border}`, padding: "0 20px", display: "flex", alignItems: "center", gap: 12, height: 52, position: "sticky", top: 0, zIndex: 50 }}>
      <span style={{ fontWeight: 700, fontSize: 16, color: ac, marginRight: 8 }}>FocusFlow</span>
 
      <nav style={{ flex: 1, display: "flex", gap: 2 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...btn, border: "none", background: tab === t ? c.bg2 : "transparent", color: tab === t ? c.text : c.text2, fontWeight: tab === t ? 500 : 400, borderRadius: 6, padding: "6px 12px", textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </nav>
 
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {streak > 0 && <span style={{ fontSize: 11, background: "#FAEEDA", color: "#633806", borderRadius: 10, padding: "2px 8px" }}>🔥 {streak}d</span>}
        <span style={{ fontSize: 12, color: c.text2 }}>{user?.name}</span>
        <button onClick={() => setMinimal(true)} style={iconBtn} title="Minimal mode"><EyeOffIcon /></button>
        <button onClick={onFullscreen} style={iconBtn} title="Fullscreen"><MaximizeIcon /></button>
        <button onClick={() => setTheme(dark ? "light" : "dark")} style={iconBtn} title="Toggle theme">
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        <button onClick={logout} style={logoutBtn} title="Sign out"><LogoutIcon /></button>
      </div>
    </header>
  );
}