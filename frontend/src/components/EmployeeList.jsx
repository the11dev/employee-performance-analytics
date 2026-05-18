import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "/api";

const DEPARTMENTS = [
  "All", "Development", "Design", "Marketing",
  "Sales", "HR", "Finance", "Operations", "Management", "Other",
];

function getScoreTier(score) {
  if (score >= 85) return { label: "Excellent", cls: "score-excellent" };
  if (score >= 70) return { label: "Good",       cls: "score-good" };
  if (score >= 50) return { label: "Average",    cls: "score-average" };
  return              { label: "Poor",           cls: "score-poor" };
}

/* Inline score editor — click the pencil to edit, Enter/checkmark to save */
function ScoreEditor({ employee, token, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(employee.performanceScore);
  const [saving, setSaving]   = useState(false);

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
      onUpdate(data.data);
      setEditing(false);
    } catch { alert("Failed to update score."); }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <input
          type="number" min="0" max="100" value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="form-input"
          style={{ width: 58, padding: "3px 6px", fontSize: "0.8rem" }}
          autoFocus
        />
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}
          style={{ padding: "3px 8px" }}>
          {saving ? <span className="spinner" style={{ width: 10, height: 10 }} /> : "✓"}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}
          style={{ padding: "3px 8px" }}>✕</button>
      </span>
    );
  }

  const tier = getScoreTier(employee.performanceScore);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span className={`score-badge ${tier.cls}`}>{employee.performanceScore}</span>
      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}
        style={{ padding: "2px 7px", opacity: 0.6 }} title="Edit score">✏</button>
    </span>
  );
}

export default function EmployeeList({ token }) {
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [deptFilter, setDeptFilter]     = useState("All");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params   = {};
      const useSearch = deptFilter !== "All" || debouncedSearch;
      if (deptFilter !== "All") params.department = deptFilter;
      if (debouncedSearch)      params.name        = debouncedSearch;

      const endpoint = useSearch ? `${API}/employees/search` : `${API}/employees`;
      const { data } = await axios.get(endpoint, {
        params, headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(data.data);
    } catch { setEmployees([]); }
    finally { setLoading(false); }
  }, [debouncedSearch, deptFilter, token]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name} from the system?`)) return;
    try {
      await axios.delete(`${API}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees((prev) => prev.filter((e) => e._id !== id));
    } catch { alert("Delete failed."); }
  };

  const handleUpdate = (updated) =>
    setEmployees((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));

  const avgScore = employees.length
    ? Math.round(employees.reduce((s, e) => s + e.performanceScore, 0) / employees.length)
    : 0;
  const topCount = employees.filter((e) => e.performanceScore >= 80).length;

  return (
    <div>
      <div className="page-header">
        <h1>Employees</h1>
        <p>Manage and track performance across your organisation.</p>
      </div>

      {/* Stats */}
      {!loading && employees.length > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{employees.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--accent)" }}>{avgScore}</div>
            <div className="stat-label">Avg Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--green)" }}>{topCount}</div>
            <div className="stat-label">High Performers</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1 }}>
          <span className="search-icon">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}>
              ×
            </button>
          )}
        </div>

        <select
          className="form-input form-select"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ width: 180, flexShrink: 0 }}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-2)" }}>
          <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
          <p style={{ marginTop: 12, fontSize: "0.83rem" }}>Loading employees...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">○</div>
          <h3>{search || deptFilter !== "All" ? "No employees found" : "No employees yet"}</h3>
          <p>{search || deptFilter !== "All"
            ? "Try adjusting your search or filter."
            : "Add your first employee using the Add Employee tab."}</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Skills</th>
                <th>Exp</th>
                <th>Score</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const tier = getScoreTier(emp.performanceScore);
                return (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.85rem" }}>{emp.name}</div>
                      <div style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>{emp.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-dept">{emp.department}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {emp.skills.slice(0, 3).map((s, i) => (
                          <span key={i} className="badge badge-skill">{s}</span>
                        ))}
                        {emp.skills.length > 3 && (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>+{emp.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>
                      {emp.experience} yr{emp.experience !== 1 ? "s" : ""}
                    </td>
                    <td>
                      <ScoreEditor employee={emp} token={token} onUpdate={handleUpdate} />
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(emp._id, emp.name)}
                        style={{ padding: "4px 9px" }}
                        title="Delete employee"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
