
import { useState } from "react";
import useStore from "../store/useAppStore";
import { useTheme } from "../lib/useTheme";

export default function AuthPage() {
  const { theme, accent, login, register, authLoading, authError, clearAuthError } = useStore();
  const { c, ac, input, label } = useTheme(theme, accent);
  const [mode, setMode]       = useState("login");
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [localError, setLocalError] = useState("");

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setLocalError("");
    clearAuthError();
  };

  const switchMode = (m) => {
    setMode(m);
    setLocalError("");
    clearAuthError();
    setForm({ name: "", email: "", password: "" });
  };

  const submit = async () => {
    if (!form.email || !form.password) return setLocalError("Please fill in all fields.");
    if (mode === "register" && !form.name) return setLocalError("Please enter your name.");

    if (mode === "login") {
      await login({ email: form.email, password: form.password });
    } else {
      await register({ name: form.name, email: form.email, password: form.password });
    }
  };

  const error = localError || authError;

  const tabStyle = (active) => ({
    flex: 1,
    textAlign: "center",
    padding: "7px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 7,
    border: "none",
    background: active ? ac : "transparent",
    color: active ? "#fff" : c.text2,
    fontFamily: "inherit",
    transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 380, background: c.card, border: `0.5px solid ${c.border}`, borderRadius: 16, padding: "36px 32px" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: ac }}>FocusFlow</div>
          <div style={{ fontSize: 13, color: c.text2, marginTop: 5 }}>
            {mode === "login" ? "Welcome back — sign in to continue" : "Create your account"}
          </div>
        </div>

        {/* Name field (register only) */}
        {mode === "register" && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ ...label, display: "block", marginBottom: 5 }}>Your name</label>
            <input value={form.name} onChange={update("name")} placeholder="Jane Smith" style={input} />
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ ...label, display: "block", marginBottom: 5 }}>Email</label>
          <input value={form.email} onChange={update("email")} placeholder="you@example.com" type="email" style={input} />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ ...label, display: "block", marginBottom: 5 }}>Password</label>
          <input
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
            type="password"
            style={input}
            onKeyDown={(e) => e.key === "Enter" && !authLoading && submit()}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: "#A32D2D", marginBottom: 12, padding: "8px 10px", background: "#FCEBEB", borderRadius: 6 }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={submit}
          disabled={authLoading}
          style={{
            width: "100%",
            background: authLoading ? c.bg3 : ac,
            color: authLoading ? c.text2 : "#fff",
            border: "none",
            borderRadius: 9,
            padding: "12px",
            fontSize: 14,
            fontWeight: 500,
            cursor: authLoading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {authLoading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        {/* Switch mode */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: c.text2 }}>
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => switchMode("register")} style={{ background: "none", border: "none", color: ac, cursor: "pointer", fontSize: 12 }}>Sign up</button>
            </>
          ) : (
            <>Already have one?{" "}
              <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: ac, cursor: "pointer", fontSize: 12 }}>Sign in</button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 20, background: c.bg2, borderRadius: 9, padding: 3 }}>
          <button onClick={() => switchMode("login")} style={tabStyle(mode === "login")}>Sign in</button>
          <button onClick={() => switchMode("register")} style={tabStyle(mode === "register")}>Sign up</button>
        </div>

      </div>
    </div>
  );
}