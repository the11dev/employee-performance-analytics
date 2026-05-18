import { useState, useEffect } from "react";
import axios from "axios";

const API = "/api";

const TIERS = [
  { label: "Excellent", min: 85, cls: "score-excellent", color: "var(--green)"  },
  { label: "Good",      min: 70, cls: "score-good",      color: "var(--accent)" },
  { label: "Average",   min: 50, cls: "score-average",   color: "var(--yellow)" },
  { label: "Poor",      min: 0,  cls: "score-poor",      color: "var(--red)"    },
];

function getTier(score) { return TIERS.find((t) => score >= t.min) || TIERS[3]; }

export default function Analytics({ token }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setEmployees(data.data))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, [token]);

  const deptStats = Object.values(
    employees.reduce((acc, emp) => {
      if (!acc[emp.department]) acc[emp.department] = { name: emp.department, total: 0, count: 0 };
      acc[emp.department].total += emp.performanceScore;
      acc[emp.department].count += 1;
      return acc;
    }, {})
  ).map((d) => ({ ...d, avg: Math.round(d.total / d.count) }))
   .sort((a, b) => b.avg - a.avg);

  const overallAvg = employees.length
    ? Math.round(employees.reduce((s, e) => s + e.performanceScore, 0) / employees.length) : 0;

  const top5 = [...employees].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);

  const tierCounts = TIERS.map((t, idx) => ({
    ...t,
    count: employees.filter((e) => {
      const next = TIERS[idx - 1];
      return e.performanceScore >= t.min && (next ? e.performanceScore < next.min : true);
    }).count || employees.filter((e) => {
      const next = TIERS[idx - 1];
      return e.performanceScore >= t.min && (next ? e.performanceScore < next.min : true);
    }).length,
  }));

  if (loading) return (
    <div style={{ textAlign: "center", padding: "56px" }}>
      <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
      <p style={{ marginTop: 12, color: "var(--text-2)", fontSize: "0.83rem" }}>Loading analytics...</p>
    </div>
  );

  if (!employees.length) return (
    <div className="empty-state">
      <div className="empty-icon">○</div>
      <h3>No data available</h3>
      <p>Add employees to view analytics.</p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Performance breakdown across departments and individuals.</p>
      </div>

      {/* Overall stats */}
      <div className="stats-row" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <div className="stat-value">{employees.length}</div>
          <div className="stat-label">Total Employees</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--accent)" }}>{overallAvg}</div>
          <div className="stat-label">Company Average</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--green)" }}>
            {employees.filter((e) => e.performanceScore >= 80).length}
          </div>
          <div className="stat-label">High Performers</div>
        </div>
      </div>

      {/* Tier distribution */}
      <div className="stats-row" style={{ marginBottom: 22 }}>
        {tierCounts.map((t) => (
          <div key={t.label} className="stat-card" style={{ borderLeft: `3px solid ${t.color}` }}>
            <div className="stat-value" style={{ color: t.color, fontSize: "1.5rem" }}>{t.count}</div>
            <div className="stat-label">{t.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

        {/* Department bar chart */}
        <div className="card">
          <p className="chart-title">Avg Score by Department</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {deptStats.map((dept) => {
              const tier = getTier(dept.avg);
              const barCls = dept.avg >= 85 ? "progress-high" : dept.avg >= 70 ? "progress-medium-good" : dept.avg >= 50 ? "progress-medium" : "progress-low";
              return (
                <div key={dept.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{dept.name}</span>
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>{dept.count} emp</span>
                      <span className={`score-badge ${tier.cls}`} style={{ fontSize: "0.78rem", padding: "1px 7px" }}>{dept.avg}</span>
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className={`progress-fill ${barCls}`} style={{ width: `${dept.avg}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 performers */}
        <div className="card">
          <p className="chart-title">Top Performers</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {top5.map((emp, i) => {
              const tier = getTier(emp.performanceScore);
              const medals = ["🥇", "🥈", "🥉", "4", "5"];
              const barCls = emp.performanceScore >= 85 ? "progress-high" : emp.performanceScore >= 70 ? "progress-medium-good" : "progress-medium";
              return (
                <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 24, textAlign: "center", fontSize: i < 3 ? "1rem" : "0.8rem", fontWeight: 700, color: "var(--text-3)", flexShrink: 0 }}>
                    {i < 3 ? medals[i] : `${i + 1}.`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.83rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</span>
                      <span className={`score-badge ${tier.cls}`} style={{ flexShrink: 0, marginLeft: 6 }}>{emp.performanceScore}</span>
                    </div>
                    <div className="progress-track" style={{ height: 4 }}>
                      <div className={`progress-fill ${barCls}`} style={{ width: `${emp.performanceScore}%` }} />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>{emp.department}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
