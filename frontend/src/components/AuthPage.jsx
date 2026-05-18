import { useState } from "react";
import axios from "axios";

const API = "/api";

/**
 * AuthPage
 * Handles both Login and Signup in a single component.
 * On success, saves the JWT and user info to localStorage and calls onLogin().
 * The `mode` state toggles between the two forms without a page reload.
 */
export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "hr" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      return setError("Email and password are required.");
    }
    if (mode === "signup" && !form.name) {
      return setError("Please enter your full name.");
    }
    if (mode === "signup" && form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, role: form.role };

      const { data } = await axios.post(`${API}${endpoint}`, payload);

      // Persist session data so the user stays logged in after a browser refresh
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
      {/* Ambient background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card">
        {/* Brand header */}
        <div className="auth-brand">
          <div className="brand-icon" style={{ width: 48, height: 48, fontSize: "1.4rem", borderRadius: 14, margin: "0 auto 16px" }}>📈</div>
          <h1 className="auth-title">PerformAI</h1>
          <p className="auth-subtitle">
            {mode === "login" ? "Sign in to your HR dashboard" : "Create your HR account"}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="auth-toggle">
          <button
            className={`auth-toggle-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
            type="button"
          >
            Login
          </button>
          <button
            className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Name field — signup only */}
          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Vaishali Sharma"
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="e.g. hr@company.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={mode === "signup" ? "Minimum 6 characters" : "Enter your password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {/* Role selector — signup only */}
          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-input form-select"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              >
                <option value="hr">HR Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="auth-error">⚠️ {error}</div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading
              ? <><span className="spinner" /> {mode === "login" ? "Signing in..." : "Creating account..."}</>
              : mode === "login" ? "🔐 Sign In" : "🚀 Create Account"
            }
          </button>
        </form>

        <p className="auth-footer">
          {mode === "login" ? "New to PerformAI? " : "Already have an account? "}
          <button
            className="auth-link"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            type="button"
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
