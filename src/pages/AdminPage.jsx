
import { useState, useEffect } from "react";
import useAppStore, { SESSIONS } from "../store/useAppStore";
import { useTheme } from "../lib/useTheme";
import { authAPI } from "../api";

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminPage() {
  const store = useAppStore();
  const { theme, accent, user, sessionLog, tasks, goals } = store;
  const { c: colors, card, label, ac: accentColor } = useTheme(theme, accent);

  const [userCount, setUserCount]   = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [users, setUsers]           = useState([]);

  useEffect(() => {
    authAPI.getUserCount()
      .then(res => {
        setUserCount(res.count);
        setActiveCount(res.activeCount);
      })
      .catch(() => {});

    authAPI.getUsers()
      .then(res => setUsers(res.users))
      .catch(() => {});
  }, []);

  if (user?.role !== "admin") {
    return (
      <div style={{ fontSize: 14, color: colors.text3, textAlign: "center", padding: "40px 0" }}>
        Access restricted.
      </div>
    );
  }

  const todaySessions = sessionLog.filter(l => l.date === today());
  const totalMins = sessionLog.reduce((s, l) => s + l.mins, 0);

  const byType = Object.keys(SESSIONS).map(k => ({
    type: k, count: sessionLog.filter(l => l.type === k).length,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...label }}>Admin dashboard</div>

      {/* Overview stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {[
          { v: userCount,            l: "Total users",    color: accentColor },
          { v: activeCount,          l: "Active users",   color: "#0F6E56" },
          { v: sessionLog.length,    l: "Total sessions", color: "#3B6D11" },
          { v: `${totalMins}m`,      l: "Total focus",    color: colors.text },
          { v: todaySessions.length, l: "Today sessions", color: colors.text },
        ].map(s => (
          <div key={s.l} style={{ background: colors.bg2, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 26, fontWeight: 500, color: s.color }}>{s.v}</div>
            <div style={{ fontSize: 11, color: colors.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Server status */}
        <div style={card}>
          <div style={{ ...label, marginBottom: 12 }}>Server status</div>
          {[
            ["API server",       "Operational"],
            ["Database",         "Operational"],
            ["Audio CDN",        "Operational"],
            ["Auth service",     "Operational"],
            ["Chrome extension", "Operational"],
          ].map(([s, st]) => (
            <div key={s} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `0.5px solid ${colors.border}`, fontSize: 12 }}>
              <span style={{ color: colors.text2 }}>{s}</span>
              <span style={{ color: st === "Operational" ? "#3B6D11" : "#854F0B", display: "flex", alignItems: "center", gap: 4 }}>
                <i className={`ti ${st === "Operational" ? "ti-circle-check" : "ti-clock"}`} style={{ fontSize: 13 }} />
                {st}
              </span>
            </div>
          ))}
        </div>

        {/* Sessions by type */}
        <div style={card}>
          <div style={{ ...label, marginBottom: 12 }}>Sessions by type</div>
          {byType.map(({ type, count }) => (
            <div key={type} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: colors.text2 }}>{SESSIONS[type].label}</span>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: colors.text3 }}>{count}</span>
              </div>
              <div style={{ height: 5, background: colors.bg3, borderRadius: 3 }}>
                <div style={{
                  height: "100%",
                  background: SESSIONS[type].color,
                  borderRadius: 3,
                  width: `${sessionLog.length > 0 ? (count / sessionLog.length) * 100 : 0}%`,
                  transition: "width 0.5s",
                }} />
              </div>
            </div>
          ))}
          {sessionLog.length === 0 && (
            <div style={{ fontSize: 12, color: colors.text3 }}>No session data yet.</div>
          )}
        </div>

        {/* Registered users */}
        <div style={{ ...card, overflowY: "auto", maxHeight: 300 }}>
          <div style={{ ...label, marginBottom: 12 }}>Registered users</div>
          {users.length === 0 && (
            <div style={{ fontSize: 12, color: colors.text3 }}>No users found.</div>
          )}
          {users.map(u => (
            <div key={u._id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: colors.bg2, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: u.role === "admin" ? accentColor : colors.bg3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: u.role === "admin" ? "#fff" : colors.text2, flexShrink: 0 }}>
                {u.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                <div style={{ fontSize: 11, color: colors.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
              </div>
              <div style={{ fontSize: 10, color: u.role === "admin" ? accentColor : colors.text3, flexShrink: 0 }}>
                {u.role === "admin" ? "Admin" : "User"}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}