import { useEffect, useState } from "react";
import useAppStore, { SESSIONS } from "../store/useAppStore";
import { useTheme } from "../lib/useTheme";
import { sessionsAPI } from "../api";

const today   = () => new Date().toISOString().slice(0, 10);
const weekday = (d) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(d).getDay()];

export default function AnalyticsPage() {
  const store = useAppStore();
  const { theme, accent, sessionLog, streak, tasks, goals, doneSessions } = store;
  const { c: colors, card, label, btn, ac: accentColor } = useTheme(theme, accent);

  const [backendStats, setBackendStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch live stats from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await sessionsAPI.getStats();
        setBackendStats(res.stats);
      } catch {
        // Fall back to local sessionLog silently
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [doneSessions]); // Re-fetch when a new session completes

  // Use backend stats if available, otherwise compute from local log
  const todaySessions = sessionLog.filter((l) => l.date === today());
  const todayMins     = backendStats
    ? Math.round(backendStats.today?.todayMinutes || 0)
    : todaySessions.reduce((s, l) => s + l.mins, 0);
  const todayCount    = backendStats?.today?.todaySessions ?? todaySessions.length;

  const score = Math.min(100, doneSessions * 15 + tasks.filter((t) => t.done).length * 10 + goals.filter((g) => g.done).length * 10);

  const weekData = Array(7).fill(0).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, day: weekday(dateStr), count: sessionLog.filter((l) => l.date === dateStr).length };
  });
  const maxWeek = Math.max(...weekData.map((d) => d.count), 1);

  const heatmapData = Array(7).fill(null).map(() => Array(24).fill(0));
  sessionLog.forEach((l) => {
    const [h] = (l.time || "00:00").split(":").map(Number);
    const d   = new Date(l.date).getDay();
    heatmapData[d][h]++;
  });
  const maxHeat = Math.max(...heatmapData.flat(), 1);

  const exportCSV = () => {
    const rows = [["Date","Time","Type","Session","Minutes"], ...sessionLog.map((l) => [l.date, l.time, l.type, l.session, l.mins])];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const a    = document.createElement("a");
    a.href     = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "focusflow_export.csv";
    a.click();
  };

  const scoreColor = score >= 70 ? "#3B6D11" : score >= 40 ? "#854F0B" : colors.text;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { v: statsLoading ? "…" : `${score}/100`, l: "Today's score",   color: scoreColor },
          { v: `${streak}d`,                         l: "Current streak",  color: "#854F0B" },
          { v: statsLoading ? "…" : todayCount,      l: "Sessions today",  color: accentColor },
          { v: statsLoading ? "…" : `${todayMins}m`, l: "Focus minutes",   color: accentColor },
        ].map((s) => (
          <div key={s.l} style={{ background: colors.bg2, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 26, fontWeight: 500, color: s.color }}>{s.v}</div>
            <div style={{ fontSize: 11, color: colors.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* All-time from backend */}
      {backendStats?.allTime && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {[
            { v: backendStats.allTime.totalSessions || 0, l: "All-time sessions" },
            { v: `${Math.round(backendStats.allTime.totalMinutes || 0)}m`,  l: "All-time focus" },
          ].map((s) => (
            <div key={s.l} style={{ background: colors.bg2, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 26, fontWeight: 500, color: accentColor }}>{s.v}</div>
              <div style={{ fontSize: 11, color: colors.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly bar chart */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 16 }}>Weekly focus — sessions per day</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
          {weekData.map((d) => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: colors.text3 }}>{d.count > 0 ? d.count : ""}</span>
              <div style={{ width: "100%", background: d.date === today() ? accentColor : colors.bg3, borderRadius: "4px 4px 0 0", height: `${(d.count / maxWeek) * 90}px`, minHeight: d.count > 0 ? 4 : 2, transition: "height 0.5s", opacity: d.date === today() ? 1 : 0.6 }} />
              <span style={{ fontSize: 10, color: d.date === today() ? accentColor : colors.text3, fontWeight: d.date === today() ? 500 : 400 }}>{d.day}</span>
            </div>
          ))}
        </div>
        {weekData.every((d) => d.count === 0) && (
          <div style={{ fontSize: 12, color: colors.text3, textAlign: "center", marginTop: 8 }}>Complete sessions to see your weekly pattern.</div>
        )}
      </div>

      {/* Time-of-day heatmap */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 12 }}>Time-of-day heatmap</div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "36px repeat(24,1fr)", gap: 2, minWidth: 560 }}>
            <div />
            {Array(24).fill(0).map((_, h) => (
              <div key={h} style={{ fontSize: 9, color: colors.text3, textAlign: "center" }}>{h}</div>
            ))}
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day, di) => (
              <div key={day} style={{ display: "contents" }}>
                <div style={{ fontSize: 10, color: colors.text3, display: "flex", alignItems: "center" }}>{day}</div>
                {Array(24).fill(0).map((_, h) => {
                  const v = heatmapData[di][h] / maxHeat;
                  return <div key={h} style={{ height: 14, borderRadius: 2, background: v > 0 ? accentColor : colors.bg3, opacity: v > 0 ? 0.2 + v * 0.8 : 0.3 }} />;
                })}
              </div>
            ))}
          </div>
        </div>
        {sessionLog.length < 3 && (
          <div style={{ fontSize: 11, color: colors.text3, marginTop: 8, textAlign: "center" }}>Complete more sessions to populate this chart.</div>
        )}
      </div>

      {/* Top tasks from backend */}
      {backendStats?.topTasks?.length > 0 && (
        <div style={card}>
          <div style={{ ...label, marginBottom: 12 }}>Top tasks by focus sessions</div>
          {backendStats.topTasks.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `0.5px solid ${colors.border}`, fontSize: 12 }}>
              <span style={{ color: colors.text2 }}>{t.taskTitle}</span>
              <span style={{ color: accentColor, fontFamily: "monospace" }}>{t.sessions} 🍅</span>
            </div>
          ))}
        </div>
      )}

      {/* Session log + export */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
        <div style={card}>
          <div style={{ ...label, marginBottom: 10 }}>Recent sessions</div>
          {sessionLog.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.text3, padding: "10px 0" }}>No sessions yet — start your first timer.</div>
          ) : sessionLog.slice(0, 8).map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `0.5px solid ${colors.border}` }}>
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: SESSIONS[l.type]?.bg, color: SESSIONS[l.type]?.text, flexShrink: 0 }}>{SESSIONS[l.type]?.label || l.type}</span>
              <span style={{ flex: 1, fontSize: 12, color: colors.text2 }}>{l.mins} min focus</span>
              <span style={{ fontSize: 11, color: colors.text3, fontFamily: "monospace" }}>{l.time}</span>
            </div>
          ))}
        </div>
        <button onClick={exportCSV} style={{ ...btn, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderColor: accentColor, color: accentColor, whiteSpace: "nowrap" }}>
          <i className="ti ti-download" style={{ fontSize: 15 }} /> Export CSV
        </button>
      </div>
    </div>
  );
}