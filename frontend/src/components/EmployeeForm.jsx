import { useState } from "react";
import axios from "axios";

const API = "/api";

const DEPARTMENTS = [
  "Development", "Design", "Marketing", "Sales",
  "HR", "Finance", "Operations", "Management", "Other",
];

function SkillTagInput({ value, onChange, placeholder }) {
  const [inputVal, setInputVal] = useState("");

  const addSkill = (raw) => {
    const skill = raw.trim();
    if (skill && !value.map((s) => s.toLowerCase()).includes(skill.toLowerCase())) {
      onChange([...value, skill]);
    }
    setInputVal("");
  };

  return (
    <div className="tag-input-wrapper">
      {value.map((skill, i) => (
        <span key={i} className="skill-tag">
          {skill}
          <button className="skill-tag-remove" type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      <input
        className="tag-input-field"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(inputVal); }
          else if (e.key === "Backspace" && !inputVal && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => inputVal.trim() && addSkill(inputVal)}
        placeholder={value.length === 0 ? placeholder : "Add more..."}
      />
    </div>
  );
}

function scoreTierLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Needs Improvement";
}

function Toast({ msg, type, onClose }) {
  return (
    <div className={`toast ${type}`}>
      <span>{msg}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

export default function EmployeeForm({ onSuccess, token }) {
  const [form, setForm] = useState({
    name: "", email: "", department: "",
    skills: [], performanceScore: "", experience: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const showToast = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.department || !form.performanceScore || !form.experience)
      return showToast("Please fill in all required fields.", "error");
    if (!form.skills.length)
      return showToast("Add at least one skill.", "error");
    const score = Number(form.performanceScore);
    if (score < 0 || score > 100)
      return showToast("Performance score must be between 0 and 100.", "error");

    setLoading(true);
    try {
      await axios.post(
        `${API}/employees`,
        { ...form, performanceScore: score, experience: Number(form.experience) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`${form.name} added successfully.`, "success");
      setForm({ name: "", email: "", department: "", skills: [], performanceScore: "", experience: "" });
      setTimeout(() => onSuccess?.(), 1200);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add employee.", "error");
    } finally {
      setLoading(false);
    }
  };

  const score = Number(form.performanceScore);
  const scoreLabel = form.performanceScore !== "" ? scoreTierLabel(score) : "";
  const scoreCls   = score >= 85 ? "score-excellent" : score >= 70 ? "score-good" : score >= 50 ? "score-average" : "score-poor";

  return (
    <div>
      <div className="page-header">
        <h1>Add Employee</h1>
        <p>Register a new employee's performance profile.</p>
      </div>

      <div className="form-wrapper">
        <div className="card">
          <form onSubmit={handleSubmit} className="form-grid">

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Aman Verma" />
              </div>
              <div className="form-group">
                <label className="form-label">Work Email *</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="e.g. aman@company.com" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-input form-select" value={form.department}
                onChange={(e) => set("department", e.target.value)}>
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Skills * <span className="form-label-hint">— press Enter or comma to add</span>
              </label>
              <SkillTagInput value={form.skills} onChange={(v) => set("skills", v)}
                placeholder="e.g. React, Node.js, Python..." />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Performance Score * (0–100)</label>
                <input className="form-input" type="number" min="0" max="100"
                  value={form.performanceScore}
                  onChange={(e) => set("performanceScore", e.target.value)}
                  placeholder="e.g. 85" />
                {scoreLabel && (
                  <span className={`score-pill ${scoreCls}`} style={{ marginTop: 5 }}>
                    {scoreLabel}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience *</label>
                <input className="form-input" type="number" min="0" step="0.5"
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value)}
                  placeholder="e.g. 3" />
              </div>
            </div>

            <div className="divider" />

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : "Add Employee"}
            </button>

          </form>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
