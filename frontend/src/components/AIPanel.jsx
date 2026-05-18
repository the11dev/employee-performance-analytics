import { useState } from "react";
import axios from "axios";

const API = "/api";

function getScoreTier(score) {
  if (score >= 85) return { label: "Excellent", cls: "score-excellent" };
  if (score >= 70) return { label: "Good",       cls: "score-good" };
  if (score >= 50) return { label: "Average",    cls: "score-average" };
  return              { label: "Poor",           cls: "score-poor" };
}

/* ── Ranking table row ───────────────────────────────────────────────────────── */
function RankingRow({ emp }) {
  const tier = getScoreTier(emp.score);
  const medals = ["🥇", "🥈", "🥉"];
  const rankLabel = emp.rank <= 3 ? medals[emp.rank - 1] : `#${emp.rank}`;
  const barCls = emp.score >= 85 ? "progress-high" : emp.score >= 70 ? "progress-medium-good" : emp.score >= 50 ? "progress-medium" : "progress-low";

  return (
    <tr>
      <td style={{ width: 44, textAlign: "center", fontSize: "0.9rem" }}>{rankLabel}</td>
      <td>
        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{emp.name}</div>
        <div style={{ fontSize: "0.73rem", color: "var(--text-3)" }}>{emp.department}</div>
      </td>
      <td style={{ width: 120 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="progress-track" style={{ flex: 1 }}>
            <div className={`progress-fill ${barCls}`} style={{ width: `${emp.score}%` }} />
          </div>
          <span className={`score-badge ${tier.cls}`} style={{ flexShrink: 0 }}>{emp.score}</span>
        </div>
      </td>
      <td><span className={`tier-label ${tier.cls}`}>{tier.label}</span></td>
      <td style={{ fontSize: "0.78rem", color: "var(--text-2)", maxWidth: 300 }}>{emp.feedback}</td>
    </tr>
  );
}

/* ── Promotion card ──────────────────────────────────────────────────────────── */
function PromotionCard({ candidate, rank }) {
  return (
    <div className="ai-card promo-card">
      <div className="card-header">
        <div>
          <div className="card-title">{candidate.name}</div>
          <div className="card-subtitle">{candidate.department}</div>
        </div>
        <span className="score-badge score-excellent">{candidate.score}</span>
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.65 }}>{candidate.reason}</p>
    </div>
  );
}

/* ── Training card ───────────────────────────────────────────────────────────── */
function TrainingCard({ emp }) {
  return (
    <div className="ai-card training-card">
      <div className="card-header">
        <div>
          <div className="card-title">{emp.name}</div>
          <div className="card-subtitle">{emp.department}</div>
        </div>
        <span className="score-badge score-poor">{emp.score}</span>
      </div>

      {emp.skillGaps?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Skill Gaps</p>
          <div className="skills-row" style={{ marginTop: 0 }}>
            {emp.skillGaps.map((s, i) => <span key={i} className="badge badge-gap">{s}</span>)}
          </div>
        </div>
      )}

      {emp.suggestedCourses?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggested Courses</p>
          <div className="skills-row" style={{ marginTop: 0 }}>
            {emp.suggestedCourses.map((c, i) => <span key={i} className="badge badge-course">{c}</span>)}
          </div>
        </div>
      )}

      <div className="ai-interview-q">{emp.trainingPlan}</div>
    </div>
  );
}

const SECTIONS = [
  { id: "rankings", label: "Rankings"   },
  { id: "promo",    label: "Promotions" },
  { id: "training", label: "Training"   },
  { id: "summary",  label: "Summary"    },
];

export default function AIPanel({ token }) {
  const [results, setResults]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [activeSection, setActiveSection] = useState("rankings");

  const handleGenerate = async () => {
    setError(""); setLoading(true); setResults(null);
    try {
      const { data } = await axios.post(`${API}/ai/recommend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(data.data);
      setActiveSection("rankings");
    } catch (err) {
      setError(err.response?.data?.message || "AI recommendation failed. Check your OpenRouter API key.");
    } finally { setLoading(false); }
  };

  const counts = {
    rankings: results?.employeeRankings?.length,
    promo:    results?.promotionCandidates?.length,
    training: results?.trainingRecommendations?.length,
  };

  return (
    <div>
      <div className="page-header">
        <h1>AI Report</h1>
        <p>Generate promotion recommendations, training plans, and performance rankings using AI.</p>
      </div>

      {/* Trigger bar */}
      <div className="card ai-trigger-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Generate Performance Report</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
              Powered by OpenRouter · GPT-4o mini · Analyses all employees in the database
            </div>
          </div>
          <button className="btn btn-ai" onClick={handleGenerate} disabled={loading} style={{ flexShrink: 0 }}>
            {loading ? <><span className="spinner" /> Analysing...</> : "Run AI Report"}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 14, padding: "9px 12px", background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius)", color: "#f87171", fontSize: "0.8rem" }}>
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-2)" }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
          <p style={{ marginTop: 14, fontSize: "0.83rem" }}>Analysing your team — this takes a few seconds.</p>
        </div>
      )}

      {!results && !loading && (
        <div className="empty-state">
          <div className="empty-icon">○</div>
          <h3>No report generated yet</h3>
          <p>Click "Run AI Report" to get promotions, training plans, and rankings.</p>
        </div>
      )}

      {results && !loading && (
        <>
          <div className="section-tabs">
            {SECTIONS.map((s) => (
              <button key={s.id}
                className={`section-tab-btn ${activeSection === s.id ? "active" : ""}`}
                onClick={() => setActiveSection(s.id)}>
                {s.label}
                {counts[s.id] != null && (
                  <span className="section-tab-count">{counts[s.id]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Rankings — table layout */}
          {activeSection === "rankings" && (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th><th>Employee</th><th>Score</th><th>Tier</th><th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {results.employeeRankings?.map((emp) => (
                    <RankingRow key={emp.name} emp={emp} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Promotions */}
          {activeSection === "promo" && (
            results.promotionCandidates?.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {results.promotionCandidates.map((c, i) => (
                  <PromotionCard key={c.name} candidate={c} rank={i + 1} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">○</div>
                <h3>No promotion candidates</h3>
                <p>Employees scoring 80 or above will appear here.</p>
              </div>
            )
          )}

          {/* Training */}
          {activeSection === "training" && (
            results.trainingRecommendations?.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {results.trainingRecommendations.map((e) => (
                  <TrainingCard key={e.name} emp={e} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">○</div>
                <h3>No training plans needed</h3>
                <p>All employees are performing above the threshold (score ≥ 70).</p>
              </div>
            )
          )}

          {/* Summary */}
          {activeSection === "summary" && results.summary && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-value">{results.summary.totalEmployees}</div>
                  <div className="stat-label">Total Employees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--accent)" }}>{results.summary.avgScore}</div>
                  <div className="stat-label">Average Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--green)" }}>{results.summary.topPerformers}</div>
                  <div className="stat-label">Top Performers</div>
                </div>
              </div>
              <div className="card">
                <p style={{ fontSize: "0.72rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  Overall Insight
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-2)", lineHeight: 1.75 }}>
                  {results.summary.overallInsight}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
