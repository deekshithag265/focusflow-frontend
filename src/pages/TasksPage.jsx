import { useState } from "react";
import useAppStore from "../store/useAppStore";
import { useTheme } from "../lib/useTheme";

export default function TasksPage() {
  const store = useAppStore();
  const { theme, accent, tasks, goals, tasksLoading } = store;
  const { c: colors, card, input, btn, label, tag: tagColor, ac: accentColor } = useTheme(theme, accent);
  const [taskInput, setTaskInput] = useState("");
  const [taskType, setTaskType]   = useState("any");

  const addTask = async () => {
    if (!taskInput.trim()) return;
    await store.addTask(taskInput.trim(), taskType);
    setTaskInput("");
  };

  const typeOptions = { any: "Any", deep: "Deep", light: "Light", read: "Reading" };

  return (
    
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", minHeight: "calc(100vh - 110px)", width: "100%" }}>
      {/* Left — Add + Goals */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <div style={{ ...label, marginBottom: 12 }}>Add task</div>
          <input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="What needs to get done?"
            style={{ ...input, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {Object.entries(typeOptions).map(([k, v]) => (
              <button key={k} onClick={() => setTaskType(k)} style={{ ...btn, flex: 1, padding: "5px 8px", fontSize: 11, transition: "all 0.15s", background: taskType === k ? (tagColor[k]?.bg || colors.bg3) : "transparent", color: taskType === k ? (tagColor[k]?.text || colors.text2) : colors.text3, borderColor: taskType === k ? "transparent" : colors.border }}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={addTask} style={{ ...btn, width: "100%", textAlign: "center", borderColor: accentColor, color: accentColor, padding: "9px" }}>
            <i className="ti ti-plus" style={{ marginRight: 5 }} /> Add task
          </button>
        </div>

        {/* Goals */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={label}>Today's goals</span>
            <span style={{ fontSize: 11, color: colors.text3 }}>{goals.filter((g) => g.done).length} / 3</span>
          </div>
          {goals.map((g, i) =>
            g.text ? (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 0", borderBottom: `0.5px solid ${colors.border}` }}>
                <button onClick={() => store.toggleGoal(i)} style={{ width: 20, height: 20, borderRadius: 4, border: `0.5px solid ${g.done ? "#0F6E56" : colors.border}`, background: g.done ? "#E1F5EE" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {g.done && <i className="ti ti-check" style={{ fontSize: 11, color: "#085041" }} />}
                </button>
                <span style={{ fontSize: 13, color: g.done ? colors.text3 : colors.text, textDecoration: g.done ? "line-through" : "none", flex: 1 }}>{g.text}</span>
              </div>
            ) : null
          )}
          {goals.every((g) => !g.text) && (
            <div style={{ fontSize: 12, color: colors.text3 }}>No goals set — go to the timer tab to add them.</div>
          )}
        </div>
      </div>

      {/* Right — Task list */}
      <div style={{ ...card, minHeight: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={label}>All tasks</span>
          <span style={{ fontSize: 11, color: colors.text3 }}>
            {tasksLoading ? "Loading…" : `${tasks.filter((t) => t.done).length} / ${tasks.length} done`}
          </span>
        </div>

        {tasksLoading && (
          <div style={{ fontSize: 12, color: colors.text3, textAlign: "center", padding: "40px 0" }}>
            <i className="ti ti-loader-2" style={{ fontSize: 22, display: "block", marginBottom: 8, opacity: 0.4 }} />
            Loading tasks…
          </div>
        )}

        {!tasksLoading && tasks.length === 0 && (
          <div style={{ fontSize: 12, color: colors.text3, textAlign: "center", padding: "40px 0" }}>
            <i className="ti ti-checklist" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.3 }} />
            No tasks yet — add one on the left
          </div>
        )}

        {tasks.map((t) => (
  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: `0.5px solid ${colors.border}` }}>
    <button
      onClick={() => store.toggleTask(t.id)}
      style={{ width: 20, height: 20, borderRadius: 4, border: `0.5px solid ${t.done ? "#0F6E56" : colors.border}`, background: t.done ? "#E1F5EE" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {t.done && <i className="ti ti-check" style={{ fontSize: 11, color: "#085041" }} />}
    </button>
    <span style={{ flex: 1, fontSize: 13, color: t.done ? colors.text3 : colors.text, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
    {t.session > 0 && <span style={{ fontSize: 10, color: colors.text3, fontFamily: "monospace" }}>{t.session}🍅</span>}
    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: tagColor[t.type]?.bg || colors.bg3, color: tagColor[t.type]?.text || colors.text2, flexShrink: 0 }}>{t.type}</span>
    <button
      onClick={() => store.deleteTask(t.id)}
      style={{ background: "none", border: "none", color: colors.text3, cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0, transition: "color 0.15s", lineHeight: 1 }}
    >
      ×
    </button>
  </div>
))}
      </div>
    </div>
  );
}