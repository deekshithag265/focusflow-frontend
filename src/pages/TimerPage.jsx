import { useEffect, useRef, useState } from "react";
import useStore, { SESSIONS, QUOTES, ALARMS } from "../store/useAppStore";
import { useTheme } from "../lib/useTheme";
import { useAudio } from "../lib/useAudio";

const CIRC  = 2 * Math.PI * 88;
const fmt   = (s) => {
  const val = Number(s);
  if (isNaN(val) || val < 0) return "00:00";
  return `${String(Math.floor(val / 60)).padStart(2, "0")}:${String(val % 60).padStart(2, "0")}`;
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const timeStr  = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const PlayIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const PauseIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const ResetIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>;
const SkipIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none"/><line x1="19" y1="5" x2="19" y2="19"/></svg>;

export default function TimerPage() {
  const s = useStore();
  const { c, ac, card, btn, label, input } = useTheme(s.theme, s.accent);
  const audio          = useAudio();
  const interval       = useRef(null);
  const onPhaseEndRef  = useRef(null);

  const sess = SESSIONS[s.sessionType];

  // ── FIX: guard against NaN before computing progress ──
  const safeTimeLeft  = (typeof s.timeLeft  === "number" && !isNaN(s.timeLeft))  ? s.timeLeft  : 0;
  const safeTotalTime = (typeof s.totalTime === "number" && !isNaN(s.totalTime) && s.totalTime > 0) ? s.totalTime : 1;
  const progress      = safeTimeLeft / safeTotalTime;
  const strokeOffset  = CIRC * (1 - Math.min(1, Math.max(0, progress)));

  const dark = s.theme === "dark";

  // ── FIX: guard s.durations before accessing .focus ──
  useEffect(() => {
    if (!s.running && !s.paused) {
      const dur = s.durations?.[s.sessionType]?.focus;
      if (dur == null || isNaN(dur)) return; // store not yet hydrated
      const t = dur * 60;
      s.setTimeLeft(t);
      s.setTotalTime(t);
    }
  }, [s.sessionType, s.durations]);

  useEffect(() => () => clearInterval(interval.current), []);

  const onPhaseEnd = () => {
    onPhaseEndRef.current = null; // clear ref so interval won't double-fire
    clearInterval(interval.current);
    s.setRunning(false);
    s.setPaused(false);
    const alarm = ALARMS.find((a) => a.id === s.alarmId) || ALARMS[0];
    audio.playBell(alarm.freq);

    if (s.phase === "focus") {
      s.endBackendSession("completed");
      s.addDoneSession();
      s.addSessionLog({
        type:    s.sessionType,
        mins:    s.durations[s.sessionType].focus,
        time:    timeStr(),
        date:    todayStr(),
        session: s.sessionNum,
      });
      s.updateStreak();
      s.setShowQuote(true);
      s.setCurrentQuote(Math.floor(Math.random() * QUOTES.length));
      const bMins = (s.durations?.[s.sessionType]?.break ?? 5) * 60;
      s.setTimeLeft(bMins);
      s.setTotalTime(bMins);
      s.setPhase("break");
    } else {
      s.setShowQuote(false);
      s.nextSession();
      const fMins = (s.durations?.[s.sessionType]?.focus ?? 25) * 60;
      s.setTimeLeft(fMins);
      s.setTotalTime(fMins);
      s.setPhase("focus");
    }
  };

  // Keep ref always pointing to latest onPhaseEnd
  onPhaseEndRef.current = onPhaseEnd;

  const start = () => {
    s.setRunning(true);
    s.setPaused(false);
    if (s.phase === "focus") s.startBackendSession();

    interval.current = setInterval(() => {
      s.setTimeLeft((prev) => {
        const p = typeof prev === "number" && !isNaN(prev) ? prev : 0;
        if (p <= 1) {
          onPhaseEndRef.current?.();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const pause = () => {
    if (s.strictMode) return;
    clearInterval(interval.current);
    s.setRunning(false);
    s.setPaused(true);
    s.endBackendSession("abandoned");
  };

  const reset = () => {
    if (s.strictMode && s.running) return;
    clearInterval(interval.current);
    s.setRunning(false);
    s.setPaused(false);
    if (s.running) s.endBackendSession("abandoned");
    const focusDur = s.durations?.[s.sessionType]?.focus ?? 25;
    const breakDur = s.durations?.[s.sessionType]?.break ?? 5;
    const t = (s.phase === "focus" ? focusDur : breakDur) * 60;
    s.setTimeLeft(t);
    s.setTotalTime(t);
  };

  const todayMins = s.sessionLog.filter((l) => l.date === todayStr()).reduce((sum, l) => sum + l.mins, 0);

  const roundBtn = {
    width: 42, height: 42, borderRadius: "50%", padding: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    border: "none", color: dark ? "#E8E4DC" : "#1A1614", cursor: "pointer",
  };

  const playBtn = {
    width: 56, height: 56, borderRadius: "50%", border: "none",
    background: ac, color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 4px 16px ${ac}55`,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: s.minimal ? "1fr" : "minmax(0,1.1fr) minmax(0,0.9fr)", gap: 16, ...(s.minimal && { maxWidth: 420, margin: "0 auto", paddingTop: "15vh" }) }}>

      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Session type picker */}
        {!s.minimal && (
          <div style={card}>
            <div style={{ ...label, marginBottom: 10 }}>Session type</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {Object.entries(SESSIONS).map(([k, v]) => (
                <button key={k} onClick={() => { if (!s.running) s.setSessionType(k); }}
                  style={{ background: s.sessionType === k ? v.bg : c.bg2, border: `0.5px solid ${s.sessionType === k ? v.color : c.border}`, borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "center", opacity: s.running && s.sessionType !== k ? 0.5 : 1 }}>
                  <i className={`ti ${v.icon}`} style={{ fontSize: 20, color: s.sessionType === k ? v.color : c.text2, display: "block", marginBottom: 4 }} />
                  <div style={{ fontSize: 11, fontWeight: 500, color: s.sessionType === k ? v.text : c.text2 }}>{v.label}</div>
                  <div style={{ fontSize: 10, color: c.text3, marginTop: 2 }}>{s.durations?.[k]?.focus ?? "?"}/{s.durations?.[k]?.break ?? "?"}m</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timer ring */}
        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {s.showQuote && s.phase === "break" && (
            <div style={{ fontSize: 13, fontStyle: "italic", color: c.text2, textAlign: "center", padding: "10px 20px", marginBottom: 12, borderBottom: `0.5px solid ${c.border}`, width: "100%" }}>
              "{QUOTES[s.currentQuote]}"
            </div>
          )}

          <div style={{ position: "relative", width: 220, height: 220, margin: "8px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }} width={220} height={220} viewBox="0 0 220 220">
              <circle cx={110} cy={110} r={88} fill="none" stroke={c.border} strokeWidth={5} />
              {/* ── FIX: use strokeOffset which is always a valid number ── */}
              <circle cx={110} cy={110} r={88} fill="none" stroke={s.phase === "break" ? "#0F6E56" : ac} strokeWidth={5} strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={strokeOffset} style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div style={{ zIndex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: s.minimal ? 64 : 52, fontWeight: 300, letterSpacing: -2, lineHeight: 1 }}>
                {fmt(safeTimeLeft)}
              </div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.text2, marginTop: 6 }}>{s.phase === "focus" ? sess?.label : "Break time"}</div>
              <div style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>Session {s.sessionNum} of {s.totalSessions}</div>
            </div>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {Array(s.totalSessions).fill(0).map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < s.doneSessions ? ac : c.border, opacity: i < s.doneSessions ? 1 : 0.35 }} />
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <button onClick={reset} style={roundBtn} title="Reset"><ResetIcon /></button>
            <button onClick={s.running ? pause : start} style={playBtn} title={s.running ? "Pause" : "Start"}>
              {s.running ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={onPhaseEnd} style={roundBtn} title="Skip"><SkipIcon /></button>
          </div>

          <div style={{ fontSize: 12, color: s.running ? ac : s.paused ? "#854F0B" : c.text3, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.running ? ac : s.paused ? "#854F0B" : c.border }} />
            {s.running ? "Focus active" : s.paused ? `Paused — ${fmt(safeTimeLeft)} remaining` : "Ready to start"}
          </div>
        </div>

        {/* Distraction log */}
        {!s.minimal && (
          <div style={card}>
            <div style={{ ...label, marginBottom: 10 }}>Distraction log</div>
            <DistractionLog c={c} btn={btn} input={input} />
          </div>
        )}
      </div>

      {/* Right column */}
      {!s.minimal && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Goals */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={label}>Today's top 3 goals</span>
              <span style={{ fontSize: 11, color: c.text3 }}>{s.goals.filter((g) => g.done).length} / 3</span>
            </div>
            {s.goals.map((g, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: c.text3, width: 14, textAlign: "center" }}>{i + 1}</span>
                <input value={g.text} onChange={(e) => s.setGoalText(i, e.target.value)}
                  placeholder={["Most important goal today…", "Second priority…", "Third goal…"][i]}
                  style={{ background: c.bg2, border: `0.5px solid ${c.border}`, borderRadius: 8, padding: "8px 10px", color: g.done ? c.text3 : c.text, fontSize: 13, outline: "none", flex: 1, fontFamily: "inherit", textDecoration: g.done ? "line-through" : "none" }} />
                <button onClick={() => s.toggleGoal(i)} style={{ width: 24, height: 24, borderRadius: 5, border: `0.5px solid ${g.done ? "#0F6E56" : c.border}`, background: g.done ? "#E1F5EE" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {g.done && <i className="ti ti-check" style={{ fontSize: 12, color: "#085041" }} />}
                </button>
              </div>
            ))}
          </div>

          {/* Durations */}
          <div style={card}>
            <div style={{ ...label, marginBottom: 12 }}>Customize durations</div>
            {Object.entries(SESSIONS).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <i className={`ti ${v.icon}`} style={{ fontSize: 13, color: v.color }} />
                  <span style={{ fontSize: 12, color: c.text2, flex: 1 }}>{v.label}</span>
                  <span style={{ fontSize: 11, color: ac, fontFamily: "monospace" }}>{s.durations?.[k]?.focus ?? "?"}m / {s.durations?.[k]?.break ?? "?"}m</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="range" min={5} max={90} step={5} value={s.durations?.[k]?.focus ?? 25}
                    onChange={(e) => s.setDurations({ ...s.durations, [k]: { ...s.durations[k], focus: +e.target.value } })} style={{ flex: 1 }} />
                  <input type="range" min={1} max={20} step={1} value={s.durations?.[k]?.break ?? 5}
                    onChange={(e) => s.setDurations({ ...s.durations, [k]: { ...s.durations[k], break: +e.target.value } })} style={{ flex: 1 }} />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: c.text2, flex: 1 }}>Sessions before long break</span>
              <input type="range" min={2} max={6} value={s.totalSessions} onChange={(e) => s.setTotalSessions(+e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: ac, fontFamily: "monospace" }}>{s.totalSessions}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 10px", background: c.bg2, borderRadius: 8 }}>
              <i className="ti ti-lock" style={{ fontSize: 14, color: s.strictMode ? "#993C1D" : c.text3 }} />
              <span style={{ fontSize: 12, color: c.text2, flex: 1 }}>Strict mode (no pause once started)</span>
              <button onClick={() => s.setStrictMode(!s.strictMode)} style={{ width: 36, height: 20, borderRadius: 10, background: s.strictMode ? "#993C1D" : c.border, border: "none", cursor: "pointer", position: "relative" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: s.strictMode ? 19 : 3, transition: "left 0.2s" }} />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[{ v: s.doneSessions, l: "Sessions" }, { v: s.tasks.filter((t) => t.done).length, l: "Tasks done" }, { v: todayMins, l: "Focus min" }].map((stat) => (
              <div key={stat.l} style={{ background: c.bg2, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 500 }}>{stat.v}</div>
                <div style={{ fontSize: 10, color: c.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DistractionLog({ c, btn, input }) {
  const { distractions, addDistraction } = useStore();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addDistraction(text.trim());
    setText("");
  };

  return (
    <>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Log a distracting thought…" style={input} />
        <button onClick={submit} style={{ ...btn, flexShrink: 0, padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      {distractions.slice(-4).map((d, i) => (
        <div key={i} style={{ fontSize: 12, color: c.text2, display: "flex", gap: 8, marginTop: 8 }}>
          <span style={{ color: c.text3, fontSize: 10 }}>{d.time}</span>
          <span>{d.text}</span>
        </div>
      ))}
    </>
  );
}