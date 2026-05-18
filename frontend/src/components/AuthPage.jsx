import { useState } from "react";
import axios from "axios";

const API = "/api";

export default function AuthPage({ onLogin }) {
  const [mode, setMode]     = useState("login");
  const [form, setForm]     = useState({ name: "", email: "", password: "", role: "hr" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password)                          return setError("Email and password are required.");
    if (mode === "signup" && !form.name)                        return setError("Please enter your full name.");
    if (mode === "signup" && form.password.length < 6)          return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const payload  = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role };

      const { data } = await axios.post(`${API}${endpoint}`, payload);
      localStorage.setItem("emp_token", data.token);
      localStorage.setItem("emp_user", JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="brand-icon-lg">📈</div>
          <h1 className="auth-title">PerformAI</h1>
          <p className="auth-subtitle">
            {mode === "login" ? "Sign in to your HR dashboard" : "Create your HR account"}
          </p>
        </div>

        <div className="auth-toggle">
          <button className={`auth-toggle-btn ${mode === "login"  ? "active" : ""}`}
            onClick={() => { setMode("login");  setError(""); }} type="button">Login</button>
          <button className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); }} type="button">Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your name" autoComplete="name" />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@company.com" autoComplete="email" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "Enter password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>

          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input form-select" value={form.role}
                onChange={(e) => set("role", e.target.value)}>
                <option value="hr">HR Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading
              ? <><span className="spinner" /> {mode === "login" ? "Signing in..." : "Creating account..."}</>
              : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button className="auth-link"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            type="button">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
