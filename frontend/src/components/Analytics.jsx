import { useState, useEffect } from "react";
import axios from "axios";

const API = "/api";

// ─── Score tier config — single source of truth for colour + label ─────────────
const TIERS = [
  { label: "🌟 Excellent", min: 85, cls: "score-excellent", bg: "rgba(16,185,129,0.15)", color: "#34d399" },
  { label: "✅ Good", min: 70, cls: "score-good", bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  { label: "⚡ Average", min: 50, cls: "score-average", bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
  { label: "📉 Poor", min: 0, cls: "score-poor", bg: "rgba(239,68,68,0.15)", color: "#f87171" },
];

function getTier(score) {
  return TIERS.find((t) => score >= t.min) || TIERS[3];
}

// ─── Horizontal CSS-only bar chart for dept averages ──────────────────────────
function DeptBarChart({ deptStats }) {
  const maxScore = 100;
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 className="chart-title">📊 Department-wise Average Performance Score</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {deptStats.map((dept) => {
          const tier = getTier(dept.avg);
          return (
            <div key={dept.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{dept.name}</span>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{dept.count} employee{dept.count !== 1 ? "s" : ""}</span>
                  <span style={{ fontWeight: 700, color: tier.color }}>{dept.avg}</span>
                </span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill ${dept.avg >= 85 ? "progress-high" : dept.avg >= 70 ? "progress-medium-good" : dept.avg >= 50 ? "progress-medium" : "progress-low"}`}
                  style={{ width: `${(dept.avg / maxScore) * 100}%`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tier distribution grid ────────────────────────────────────────────────────
function TierDistribution({ employees }) {
  const counts = TIERS.map((t, idx) => ({
    ...t,
    count: employees.filter((e) => {
      const next = TIERS[idx - 1];
      return e.performanceScore >= t.min && (next ? e.performanceScore < next.min : true);
    }).length,
  }));

  return (
    <div className="stats-row" style={{ marginBottom: 24 }}>
      {counts.map((t) => (
        <div key={t.label} className="stat-card" style={{ borderColor: t.color + "44" }}>
          <div className="stat-value" style={{ color: t.color }}>{t.count}</div>
          <div className="stat-label">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Top performers podium ─────────────────────────────────────────────────────
function TopPerformers({ employees }) {
  const top5 = [...employees].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 className="chart-title">🏆 Top 5 Performers</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {top5.map((emp, i) => {
          const tier = getTier(emp.performanceScore);
          const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
          return (
            <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: "1.3rem", width: 30, textAlign: "center", flexShrink: 0 }}>{medals[i]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{emp.name}</span>
                  <span className={`score-badge ${tier.cls}`}>{emp.performanceScore}</span>
                </div>
                <div className="progress-track" style={{ height: 5 }}>
                  <div className="progress-fill progress-high" style={{ width: `${emp.performanceScore}%` }} />
                </div>
                <span style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>🏢 {emp.department}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Analytics
 * Pulls all employees and computes:
 *   - Department average performance scores (bar chart)
 *   - Performance tier distribution (Excellent/Good/Average/Poor)
 *   - Top 5 performers list
 * All calculations are done client-side from the fetched data — no extra API calls.
 */
export default function Analytics({ token }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await axios.get(`${API}/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(data.data);
      } catch {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  // Aggregate per-department stats from raw employee list
  const deptStats = Object.values(
    employees.reduce((acc, emp) => {
      if (!acc[emp.department]) acc[emp.department] = { name: emp.department, total: 0, count: 0 };
      acc[emp.department].total += emp.performanceScore;
      acc[emp.department].count += 1;
      return acc;
    }, {})
  )
    .map((d) => ({ ...d, avg: Math.round(d.total / d.count) }))
    .sort((a, b) => b.avg - a.avg);

  const overallAvg =
    employees.length
      ? Math.round(employees.reduce((s, e) => s + e.performanceScore, 0) / employees.length)
      : 0;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "64px" }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>Loading analytics...</p>
      </div>
    );
  }

  if (!employees.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>No data to display</h3>
        <p>Add employees first to view analytics and performance insights.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Performance Analytics</h1>
        <p>Visualise team performance metrics and department-level insights.</p>
      </div>

      {/* Overall summary */}
      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-value">{employees.length}</div>
          <div className="stat-label">Total Employees</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#818cf8" }}>{overallAvg}</div>
          <div className="stat-label">Company Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#34d399" }}>
            {employees.filter((e) => e.performanceScore >= 80).length}
          </div>
          <div className="stat-label">Top Performers</div>
        </div>
      </div>

      <TierDistribution employees={employees} />
      <DeptBarChart deptStats={deptStats} />
      <TopPerformers employees={employees} />
    </div>
  );
}
