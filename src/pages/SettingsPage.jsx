import { useState, useEffect, useRef } from "react";
import useStore, { ACCENTS, ALARMS } from "../store/useAppStore";
import { useTheme } from "../lib/useTheme";
import { extensionAPI } from "../extensionBridge";

const ACCENT_OPTIONS = [
  { key: "blue",   hex: ACCENTS.blue   },
  { key: "teal",   hex: ACCENTS.teal   },
  { key: "purple", hex: ACCENTS.purple },
  { key: "coral",  hex: ACCENTS.coral  },
  { key: "amber",  hex: ACCENTS.amber  },
];

const DURATIONS = ["25m", "45m", "1h", "1.5h"];
const durToDisplay = (d) => ({ "25m": "25:00", "45m": "45:00", "1h": "1:00:00", "1.5h": "1:30:00" }[d]);
const durToMinutes = (d) => ({ "25m": 25, "45m": 45, "1h": 60, "1.5h": 90 }[d]);

const DEFAULT_SITES = [
  "youtube.com", "reddit.com", "twitter.com", "x.com",
  "instagram.com", "facebook.com", "tiktok.com", "netflix.com", "twitch.tv"
];

function formatSeconds(secs) {
  if (secs === null) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusFlowSettings() {
  const {
    user,
    accent, setAccent,
    theme, setTheme,
    alarmId, setAlarmId,
    notifEnabled, setNotifEnabled,
    logout,
  } = useStore();
  const { c } = useTheme(theme, accent);

  const activeHex = ACCENTS[accent] || ACCENTS.blue;

  const [duration, setDuration] = useState("25m");
  const [customMin, setCustomMin] = useState("");
  const [blockStatus, setBlockStatus] = useState("Idle"); // Idle | Blocking | Paused
  const [showSites, setShowSites] = useState(false);
  const [sites, setSites] = useState(DEFAULT_SITES);
  const [newSite, setNewSite] = useState("");

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [totalSeconds, setTotalSeconds] = useState(null);
  const intervalRef = useRef(null);

  // Compute display time and ring progress
  const displayTime = secondsLeft !== null
    ? formatSeconds(secondsLeft)
    : durToDisplay(duration);

  const CIRCUMFERENCE = 213;
  const progress = (secondsLeft !== null && totalSeconds > 0)
    ? secondsLeft / totalSeconds
    : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Tick effect — only runs when Blocking
  useEffect(() => {
    if (blockStatus === "Blocking") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setBlockStatus("Idle");
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [blockStatus]);

  const handleStartBlocking = async () => {
    const mins = customMin ? parseInt(customMin) : durToMinutes(duration);
    const secs = mins * 60;
    try {
      await extensionAPI.startSession(mins, "Focus Session");
      setTotalSeconds(secs);
      setSecondsLeft(secs);
      setBlockStatus("Blocking");
    } catch (err) {
      alert("Extension not found. Make sure Focus Blocker is installed and active.");
    }
  };

  const handleStopBlocking = async () => {
    try {
      await extensionAPI.stopSession();
    } catch (err) {
      alert("Extension not found. Make sure Focus Blocker is installed and active.");
    } finally {
      clearInterval(intervalRef.current);
      setBlockStatus("Idle");
      setSecondsLeft(null);
      setTotalSeconds(null);
    }
  };

  const handlePause = async () => {
    try {
      if (blockStatus === "Paused") {
        await extensionAPI.resumeSession();
        setBlockStatus("Blocking"); // triggers useEffect to restart interval
      } else {
        await extensionAPI.pauseSession();
        setBlockStatus("Paused"); // triggers useEffect to clear interval
      }
    } catch (err) {
      alert("Extension not found. Make sure Focus Blocker is installed and active.");
    }
  };

  const handleAddSite = async () => {
    let domain = newSite.trim().toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
    if (!domain || !domain.includes(".")) return;
    if (sites.includes(domain)) return;
    const updated = [...sites, domain];
    setSites(updated);
    setNewSite("");
    try { await extensionAPI.updateBlocklist(updated); } catch (_) {}
  };

  const handleRemoveSite = async (domain) => {
    const updated = sites.filter(s => s !== domain);
    setSites(updated);
    try { await extensionAPI.updateBlocklist(updated); } catch (_) {}
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ padding: "32px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* APPEARANCE */}
          <Card c={c}>
            <CardTitle c={c}>Appearance</CardTitle>
            <Label c={c}>Theme</Label>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["dark", "light"].map((t) => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  flex: 1, padding: "9px 14px", borderRadius: 8, fontFamily: "inherit",
                  border: `1.5px solid ${theme === t ? activeHex : c.border}`,
                  background: theme === t ? activeHex + "22" : "transparent",
                  color: theme === t ? activeHex : c.text2,
                  fontWeight: theme === t ? 500 : 400, cursor: "pointer", fontSize: 13.5,
                  textTransform: "capitalize",
                }}>{t}</button>
              ))}
            </div>
            <Label c={c}>Accent color</Label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {ACCENT_OPTIONS.map(({ key, hex }) => (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  title={key}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", background: hex,
                    cursor: "pointer", outline: "none", transition: "transform 0.15s",
                    border: accent === key ? `3px solid ${c.text}` : "2.5px solid transparent",
                    boxShadow: accent === key ? "inset 0 0 0 2px white" : "none",
                  }}
                />
              ))}
            </div>
          </Card>

          {/* AUDIO */}
          <Card c={c}>
            <CardTitle c={c}>Audio Settings</CardTitle>
            <Label c={c}>Alarm sound</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {ALARMS.map(({ id, label }) => (
                <button key={id} onClick={() => setAlarmId(id)} style={{
                  padding: "9px 14px", borderRadius: 8, fontFamily: "inherit",
                  border: `1.5px solid ${alarmId === id ? activeHex : c.border}`,
                  background: alarmId === id ? activeHex + "22" : "transparent",
                  color: alarmId === id ? activeHex : c.text2,
                  fontWeight: alarmId === id ? 500 : 400, cursor: "pointer", fontSize: 13.5,
                }}>{label}</button>
              ))}
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingTop: 16, borderTop: `1px solid ${c.border}`,
            }}>
              <div>
                <div style={{ fontSize: 13.5, color: c.text }}>Push notifications</div>
                <div style={{ fontSize: 12, color: c.text2, marginTop: 1 }}>Break &amp; completion alerts</div>
              </div>
              <Toggle checked={notifEnabled} onChange={setNotifEnabled} activeHex={activeHex} />
            </div>
          </Card>

          {/* ACCOUNT */}
          <Card c={c}>
            <CardTitle c={c}>Account</CardTitle>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 12, background: c.bg,
              border: `1px solid ${c.border}`, marginBottom: 16,
            }}>
              <div style={{
                    width: 38, height: 38, background: activeHex + "22", color: activeHex,
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 600, flexShrink: 0,
                  }}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                  <div style={{ fontSize: 14, color: c.text, fontWeight: 500 }}>{user?.name || 'User'}</div>
            </div>
            <button
              onClick={logout}
              style={{
                width: "100%", padding: 10, borderRadius: 12,
                border: "1.5px solid #fee2e2", background: "transparent",
                color: "#ef4444", fontFamily: "inherit", fontSize: 13.5,
                fontWeight: 500, cursor: "pointer",
              }}>Sign out</button>
          </Card>

          {/* WEBSITE BLOCKER */}
          <Card c={c}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.text2 }}>
                Website Blocker
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20,
                background: "#f3f0ff", color: "#6d28d9", border: "1px solid #e5e0ff",
              }}>Extension</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, background: activeHex + "22", borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>🔒</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: c.text }}>Focus Blocker</div>
                <div style={{ fontSize: 12, color: c.text2 }}>Start a blocking session to stay focused</div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: blockStatus === "Blocking" ? "#4ade80" : blockStatus === "Paused" ? "#fbbf24" : c.text2,
                background: c.bg, border: `1px solid ${c.border}`,
                padding: "3px 10px", borderRadius: 20,
              }}>{blockStatus}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center", marginBottom: 16 }}>
              <div style={{ width: 80, height: 80, position: "relative" }}>
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="40" cy="40" r="34" fill="none" stroke={c.border} strokeWidth="4" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={activeHex} strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 500, color: c.text }}>
                    {displayTime}
                  </span>
                  <span style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: c.text2, marginTop: 1 }}>
                    {blockStatus === "Idle" ? "Ready" : blockStatus}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDuration(d); setCustomMin(""); }}
                    disabled={blockStatus !== "Idle"}
                    style={{
                      padding: "7px 10px", borderRadius: 8, fontFamily: "inherit",
                      border: `1.5px solid ${duration === d && !customMin ? activeHex : c.border}`,
                      background: duration === d && !customMin ? activeHex + "22" : "transparent",
                      color: duration === d && !customMin ? activeHex : c.text2,
                      fontWeight: duration === d && !customMin ? 500 : 400,
                      cursor: blockStatus !== "Idle" ? "not-allowed" : "pointer",
                      opacity: blockStatus !== "Idle" ? 0.5 : 1,
                      fontSize: 13,
                    }}>{d}</button>
                ))}
                <input
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  placeholder="custom min"
                  disabled={blockStatus !== "Idle"}
                  style={{
                    gridColumn: "1 / -1", padding: "7px 10px", borderRadius: 8,
                    border: `1.5px solid ${customMin ? activeHex : c.border}`,
                    background: c.bg,
                    fontFamily: "monospace", fontSize: 13, color: c.text2, outline: "none",
                    cursor: blockStatus !== "Idle" ? "not-allowed" : "text",
                    opacity: blockStatus !== "Idle" ? 0.5 : 1,
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            {blockStatus === "Idle" ? (
              <button onClick={handleStartBlocking} style={{
                width: "100%", padding: 12, borderRadius: 12, border: "none",
                background: activeHex, color: "white", fontFamily: "inherit",
                fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 14,
              }}>Start Blocking</button>
            ) : (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button onClick={handlePause} style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  background: blockStatus === "Paused" ? "#fbbf24" : "#1e1e24",
                  color: blockStatus === "Paused" ? "#000" : "#fbbf24",
                  border: "1px solid #fbbf2444",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>{blockStatus === "Paused" ? "Resume" : "Pause"}</button>
                <button onClick={handleStopBlocking} style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  background: "#1e1e24", color: "#ef4444",
                  border: "1px solid #ef444444",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>Stop</button>
              </div>
            )}

            {/* Blocked Sites */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingTop: 12, borderTop: `1px solid ${c.border}`, marginBottom: showSites ? 10 : 0,
            }}>
              <span style={{ fontSize: 13, color: c.text2 }}>Blocked sites ({sites.length})</span>
              <span
                onClick={() => setShowSites(!showSites)}
                style={{ fontSize: 13, color: activeHex, cursor: "pointer" }}>
                {showSites ? "hide ▴" : "show ▾"}
              </span>
            </div>

            {showSites && (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 150, overflowY: "auto", marginBottom: 8 }}>
                  {sites.map((domain) => (
                    <div key={domain} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "5px 8px", background: c.bg, borderRadius: 6, fontSize: 12,
                    }}>
                      <span style={{ color: c.text2 }}>{domain}</span>
                      <button onClick={() => handleRemoveSite(domain)} style={{
                        background: "none", border: "none", color: "#444", cursor: "pointer",
                        fontSize: 16, lineHeight: 1, padding: "0 2px",
                      }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSite()}
                    placeholder="e.g. twitter.com"
                    style={{
                      flex: 1, padding: "6px 10px", borderRadius: 7,
                      border: `1px solid ${c.border}`, background: c.bg,
                      color: c.text, fontSize: 12, outline: "none",
                    }}
                  />
                  <button onClick={handleAddSite} style={{
                    padding: "6px 12px", background: activeHex + "22",
                    border: `1px solid ${activeHex}`, borderRadius: 7,
                    color: activeHex, fontSize: 12, cursor: "pointer",
                  }}>Add</button>
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}

function Card({ children, c }) {
  return (
    <div style={{
      background: c.card, border: `1px solid ${c.border}`,
      borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>{children}</div>
  );
}

function CardTitle({ children, c }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: c.text2, marginBottom: 20,
    }}>{children}</div>
  );
}

function Label({ children, c }) {
  return <div style={{ fontSize: 13, color: c.text2, marginBottom: 10 }}>{children}</div>;
}

function Toggle({ checked, onChange, activeHex }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11, cursor: "pointer", position: "relative",
      background: checked ? activeHex : "#6b6860", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: checked ? 19 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "white",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}