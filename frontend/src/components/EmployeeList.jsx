import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "/api";

const DEPARTMENTS = [
  "All", "Development", "Design", "Marketing",
  "Sales", "HR", "Finance", "Operations", "Management", "Other",
];

// ─── Score → visual tier mapping ───────────────────────────────────────────────
function getScoreTier(score) {
  if (score >= 85) return { label: "🌟 Excellent", cls: "score-excellent" };
  if (score >= 70) return { label: "✅ Good", cls: "score-good" };
  if (score >= 50) return { label: "⚡ Average", cls: "score-average" };
  return { label: "📉 Poor", cls: "score-poor" };
}

// ─── Inline score editor ───────────────────────────────────────────────────────
function ScoreEditor({ employee, token, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(employee.performanceScore);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const score = Number(val);
    if (isNaN(score) || score < 0 || score > 100) return;
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${API}/employees/${employee._id}`,
        { performanceScore: score },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate(data.data); // update local list without refetch
      setEditing(false);
    } catch {
      alert("Failed to update score.");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number" min="0" max="100"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="form-input"
          style={{ width: 70, padding: "6px 8px", fontSize: "0.85rem" }}
        />
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "✓"}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>✕</button>
      </div>
    );
  }

  const tier = getScoreTier(employee.performanceScore);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className={`score-badge ${tier.cls}`}>{employee.performanceScore}</span>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setEditing(true)}
        title="Edit performance score"
        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
      >
        ✏️
      </button>
    </div>
  );
}

// ─── Individual employee card ─────────────────────────────────────────────────
function EmployeeCard({ employee, token, onDelete, onUpdate }) {
  const [deleting, setDeleting] = useState(false);
  const tier = getScoreTier(employee.performanceScore);

  const handleDelete = async () => {
    if (!confirm(`Delete employee "${employee.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/employees/${employee._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(employee._id);
    } catch {
      alert("Failed to delete employee.");
    } finally {
      setDeleting(false);
    }
  };

  // Progress bar width is tied to performance score percentage
  const barClass =
    employee.performanceScore >= 85 ? "progress-high"
      : employee.performanceScore >= 70 ? "progress-medium-good"
        : employee.performanceScore >= 50 ? "progress-medium"
          : "progress-low";

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{employee.name}</div>
          <div className="card-subtitle">{employee.email}</div>
        </div>
        <button
          className="btn btn-danger btn-sm"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete employee"
        >
          {deleting ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "🗑"}
        </button>
      </div>

      {/* Department badge */}
      <div style={{ marginBottom: 10 }}>
        <span className="badge badge-dept">🏢 {employee.department}</span>
      </div>

      {/* Performance score + inline editor */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Performance Score
          </span>
          <ScoreEditor employee={employee} token={token} onUpdate={onUpdate} />
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${barClass}`}
            style={{ width: `${employee.performanceScore}%` }}
          />
        </div>
        <div style={{ textAlign: "right", marginTop: 4 }}>
          <span className={`tier-label ${tier.cls}`}>{tier.label}</span>
        </div>
      </div>

      {/* Experience */}
      <div className="card-meta">
        <span>🕐 {employee.experience} yr{employee.experience !== 1 ? "s" : ""} experience</span>
      </div>

      {/* Skill chips */}
      <div className="skills-row" style={{ marginTop: 10 }}>
        {employee.skills.map((skill, i) => (
          <span key={i} className="badge badge-skill">{skill}</span>
        ))}
      </div>

      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 12 }}>
        Added {new Date(employee.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </div>
    </div>
  );
}

/**
 * EmployeeList
 * Fetches all employees and supports:
 *  - Department filter dropdown
 *  - Name/skill text search (debounced 350ms)
 *  - Summary stats (total, avg score, top performers)
 *  - Inline score editing per card
 *  - Delete with optimistic UI update
 */
export default function EmployeeList({ token }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  // 350ms debounce so we don't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (deptFilter !== "All") params.department = deptFilter;
      if (debouncedSearch) params.name = debouncedSearch;

      // Use search endpoint when filtering, base endpoint otherwise
      const endpoint =
        deptFilter !== "All" || debouncedSearch
          ? `${API}/employees/search`
          : `${API}/employees`;

      const { data } = await axios.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(data.data);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, deptFilter, token]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleDelete = (id) => setEmployees((prev) => prev.filter((e) => e._id !== id));
  const handleUpdate = (updated) =>
    setEmployees((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));

  // Derived stats — computed from current filtered list
  const avgScore =
    employees.length
      ? Math.round(employees.reduce((sum, e) => sum + e.performanceScore, 0) / employees.length)
      : 0;
  const topPerformers = employees.filter((e) => e.performanceScore >= 80).length;

  return (
    <div>
      <div className="page-header">
        <h1>Employee Directory</h1>
        <p>View, search, and manage all employees across departments.</p>
      </div>

      {/* Summary stat cards */}
      {!loading && employees.length > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{employees.length}</div>
            <div className="stat-label">Total Employees</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "#34d399" }}>{avgScore}</div>
            <div className="stat-label">Avg. Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "#fbbf24" }}>{topPerformers}</div>
            <div className="stat-label">Top Performers</div>
          </div>
        </div>
      )}

      {/* Filters row — search + department dropdown */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem" }}
            >
              ×
            </button>
          )}
        </div>

        <select
          className="form-input form-select"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ width: 200, flexShrink: 0 }}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d === "All" ? "🏢 All Departments" : d}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ marginTop: 16 }}>Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{search || deptFilter !== "All" ? "🔎" : "👥"}</div>
          <h3>{search || deptFilter !== "All" ? "No employees found" : "No employees yet"}</h3>
          <p>
            {search || deptFilter !== "All"
              ? "Try adjusting your search or filter."
              : "Add your first employee using the Add Employee tab."}
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp._id}
              employee={emp}
              token={token}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
