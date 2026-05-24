import { create } from "zustand";
import { authAPI, tasksAPI, sessionsAPI } from "../api";

const todayStr = () => new Date().toISOString().slice(0, 10);
const timeStr  = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const SESSIONS = {
  deep:  { label: "Deep Work",  icon: "ti-brain",     color: "#185FA5", bg: "#E6F1FB", text: "#0C447C" },
  light: { label: "Light Task", icon: "ti-checklist", color: "#0F6E56", bg: "#E1F5EE", text: "#085041" },
  read:  { label: "Reading",    icon: "ti-book",      color: "#534AB7", bg: "#EEEDFE", text: "#3C3489" },
};

export const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Focus is the art of knowing what to ignore.",
  "Deep work is the superpower of the 21st century.",
  "Energy, not time, is the fundamental currency of high performance.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
];

export const ALARMS = [
  { id: "bell",  label: "Bell",  freq: 528 },
  { id: "chime", label: "Chime", freq: 660 },
  { id: "gong",  label: "Gong",  freq: 440 },
  { id: "ping",  label: "Ping",  freq: 880 },
];

export const ACCENTS = {
  blue: "#185FA5", teal: "#0F6E56", purple: "#534AB7", coral: "#993C1D", amber: "#854F0B",
};

// ─────────────────────────────────────────────────────────────────
// Helper: map backend task → local task shape
// ─────────────────────────────────────────────────────────────────
const toLocalTask = (t) => ({
  id:      t._id,
  _id:     t._id,
  text:    t.title,
  type:    t.tags?.[0] || "any",
  done:    t.status === "completed",
  session: t.completedPomodoros || 0,
});

// ─────────────────────────────────────────────────────────────────
// Helper: map backend session log entry → local sessionLog shape
// ─────────────────────────────────────────────────────────────────
const toLocalLog = (s) => ({
  _id:     s._id,
  type:    s.type === "focus" ? (s.task ? "deep" : "deep") : s.type,
  mins:    s.duration,
  time:    new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  date:    new Date(s.startedAt).toISOString().slice(0, 10),
  session: 1,
});

const useStore = create((set, get) => ({

  // ── Auth state ────────────────────────────────────────────────
  user:        null,
  screen:      "login",
  authLoading: false,
  authError:   null,

  // Login — calls real API, stores token
  login: async ({ email, password }) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem("ff_token", res.token);
      const role = res.user.email === "admin@focusflow.app" ? "admin" : (res.user.role || "user");
      set({ user: { ...res.user, role }, screen: "app", authLoading: false, tab: "timer" }); // ← tab reset
      get().fetchTasks();
      get().fetchSessionLog();
      if (res.user.settings) {
        const { focusDuration, shortBreak, longBreak } = res.user.settings;
        set({
          durations: {
            deep:  { focus: focusDuration || 50, break: shortBreak || 10 },
            light: { focus: 25,                  break: shortBreak || 5  },
            read:  { focus: 30,                  break: shortBreak || 7  },
          },
        });
      }
      history.pushState({ screen: "app" }, "", "#app");
    } catch (err) {
      set({ authError: typeof err === "string" ? err : "Login failed", authLoading: false });
    }
  },

  // Register — calls real API
  register: async ({ name, email, password }) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await authAPI.register({ name, email, password });
      localStorage.setItem("ff_token", res.token);
      set({ user: { ...res.user, role: "user" }, screen: "app", authLoading: false, tab: "timer" }); // ← tab reset
      history.pushState({ screen: "app" }, "", "#app");
    } catch (err) {
      set({ authError: typeof err === "string" ? err : "Registration failed", authLoading: false });
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem("ff_token");
    history.pushState({ screen: "login" }, "", "#login");
    set({
      user: null, screen: "login", authError: null, tab: "timer", // ← tab reset
      tasks: [], sessionLog: [], goals: [
        { text: "", done: false },
        { text: "", done: false },
        { text: "", done: false },
      ],
    });
  },

  // Try to restore session from stored token on app load
  rehydrate: async () => {
    const token = localStorage.getItem("ff_token");
    if (!token) return;
    try {
      const res = await authAPI.getMe();
      const role = res.user?.email === "admin@focusflow.app" ? "admin" : (res.user?.role || "user");
      set({ user: { ...res.user, role }, screen: "app" });
      get().fetchTasks();
      get().fetchSessionLog();
    } catch {
      localStorage.removeItem("ff_token");
    }
  },

  // Legacy setUser / setScreen (kept so Header logout still works)
  setUser:        (user)   => set({ user }),
  setScreen:      (screen) => { history.pushState({ screen }, "", `#${screen}`); set({ screen }); },
  clearAuthError: ()       => set({ authError: null }),

  // ── Theme ─────────────────────────────────────────────────────
  theme:     "dark",
  accent:    "blue",
  tab:       "timer",
  minimal:   false,
  setTheme:  (v) => set({ theme: v }),
  setAccent: (v) => set({ accent: v }),
  setTab:    (v) => set({ tab: v }),
  setMinimal:(v) => set({ minimal: v }),

  // ── Timer ─────────────────────────────────────────────────────
  sessionType:    "deep",
  phase:          "focus",
  running:        false,
  paused:         false,
  strictMode:     false,
  sessionNum:     1,
  totalSessions:  4,
  doneSessions:   0,
  timeLeft:       50 * 60,
  totalTime:      50 * 60,
  durations: {
    deep:  { focus: 50, break: 10 },
    light: { focus: 25, break: 5  },
    read:  { focus: 30, break: 7  },
  },
  showQuote:      false,
  currentQuote:   0,
  breathActive:   false,
  activeSessionId: null,

  setSessionType:  (type) => {
    const mins = get().durations[type].focus * 60;
    set({ sessionType: type, phase: "focus", timeLeft: mins, totalTime: mins, running: false, paused: false });
  },
  setPhase:        (v) => set({ phase: v }),
  setRunning:      (v) => set({ running: v }),
  setPaused:       (v) => set({ paused: v }),
  setStrictMode:   (v) => set({ strictMode: v }),
  setTimeLeft: (v) => set((s) => ({ timeLeft: typeof v === "function" ? v(s.timeLeft) : v })),
  setTotalTime:    (v) => set({ totalTime: v }),
  setShowQuote:    (v) => set({ showQuote: v }),
  setCurrentQuote: (v) => set({ currentQuote: v }),
  setBreathActive: (v) => set({ breathActive: v }),
  addDoneSession:  () => set((s) => ({ doneSessions: s.doneSessions + 1 })),
  nextSession:     () => set((s) => ({ sessionNum: s.sessionNum + 1 })),
  setTotalSessions:(v) => set({ totalSessions: v }),

  // Save duration changes to backend too
  setDurations: async (v) => {
    set({ durations: v });
    try {
      await authAPI.updateSettings({
        focusDuration: v.deep.focus,
        shortBreak:    v.deep.break,
        longBreak:     v.deep.break * 2,
      });
    } catch { /* silent — local change already applied */ }
  },

  // Start a backend session when timer begins
  startBackendSession: async (taskId = null) => {
    const { sessionType, durations, phase } = get();
    if (phase !== "focus") return;
    try {
      const res = await sessionsAPI.start({
        type:     "focus",
        duration: durations[sessionType].focus,
        taskId:   taskId || null,
      });
      set({ activeSessionId: res.session._id });
    } catch { /* timer still works locally */ }
  },

  // End the backend session when phase completes
  endBackendSession: async (status = "completed") => {
    const { activeSessionId } = get();
    if (!activeSessionId) return;
    try {
      await sessionsAPI.end(activeSessionId, { status });
      set({ activeSessionId: null });
      get().fetchSessionLog();
    } catch { set({ activeSessionId: null }); }
  },

  // ── Goals ─────────────────────────────────────────────────────
  goals: [
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ],
  setGoalText: (i, text) => set((s) => ({ goals: s.goals.map((g, idx) => idx === i ? { ...g, text } : g) })),
  toggleGoal:  (i)       => set((s) => ({ goals: s.goals.map((g, idx) => idx === i ? { ...g, done: !g.done } : g) })),

  // ── Tasks (synced with backend) ───────────────────────────────
  tasks:        [],
  tasksLoading: false,

  fetchTasks: async () => {
    set({ tasksLoading: true });
    try {
      const res = await tasksAPI.getAll();
      set({ tasks: res.tasks.map(toLocalTask), tasksLoading: false });
    } catch {
      set({ tasksLoading: false });
    }
  },

  addTask: async (text, type = "any") => {
    const tempId = `temp_${Date.now()}`;
    const optimistic = { id: tempId, text, type, done: false, session: 0 };
    set((s) => ({ tasks: [...s.tasks, optimistic] }));
    try {
      const res = await tasksAPI.create({
        title: text,
        tags:  [type],
        priority: type === "deep" ? "high" : type === "light" ? "low" : "medium",
      });
      const saved = toLocalTask(res.task);
      set((s) => ({ tasks: s.tasks.map((t) => t.id === tempId ? saved : t) }));
    } catch {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== tempId) }));
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, done: newDone } : t) }));
    try {
      await tasksAPI.update(id, { status: newDone ? "completed" : "in_progress" });
    } catch {
      set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, done: task.done } : t) }));
    }
  },

  deleteTask: async (id) => {
    const prev = get().tasks;
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    try {
      await tasksAPI.remove(id);
    } catch {
      set({ tasks: prev });
    }
  },

  // ── Distractions (local only) ─────────────────────────────────
  distractions: [],
  addDistraction: (text) => set((s) => ({
    distractions: [...s.distractions, { text, time: timeStr() }],
  })),

  // ── Audio (local only) ────────────────────────────────────────
  soundMix:       { rain: 0, cafe: 0, white: 0, lofi: 0, forest: 0, ocean: 0 },
  masterVol:      60,
  alarmId:        "bell",
  notifEnabled:   false,
  setSoundMix:    (v) => set({ soundMix: v }),
  setMasterVol:   (v) => set({ masterVol: v }),
  setAlarmId:     (v) => set({ alarmId: v }),
  setNotifEnabled:(v) => set({ notifEnabled: v }),

  // ── Analytics (synced with backend) ──────────────────────────
  sessionLog:    [],
  streak:        0,
  lastStreakDate:"",

  fetchSessionLog: async () => {
    try {
      const res = await sessionsAPI.getAll({ limit: 50, status: "completed" });
      set({ sessionLog: res.sessions.map(toLocalLog) });
    } catch { /* keep existing local log */ }
  },

  addSessionLog: (entry) => set((s) => ({ sessionLog: [entry, ...s.sessionLog] })),

  updateStreak: () => {
    const today = todayStr();
    const { lastStreakDate, streak } = get();
    if (lastStreakDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    set({ streak: lastStreakDate === y ? streak + 1 : 1, lastStreakDate: today });
  },
}));

export default useStore;

