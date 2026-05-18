import { useState } from "react";
import axios from "axios";

const API = "/api";

// ─── Score tier helper (shared display logic) ──────────────────────────────────
function getScoreTier(score) {
  if (score >= 85) return { label: "Excellent", cls: "score-excellent" };
  if (score >= 70) return { label: "Good", cls: "score-good" };
  if (score >= 50) return { label: "Average", cls: "score-average" };
  return { label: "Poor", cls: "score-poor" };
}

// ─── Promotion candidate card ──────────────────────────────────────────────────
function PromotionCard({ candidate, rank }) {
  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
  return (
    <div className="card ai-card promo-card">
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="ai-rank-badge">{rankEmoji}</div>
          <div>
            <div className="card-title">{candidate.name}</div>
            <div className="card-subtitle">🏢 {candidate.department}</div>
          </div>
        </div>
        <span className={`score-badge score-excellent`} style={{ fontSize: "1.1rem", padding: "6px 14px" }}>
          {candidate.score}
        </span>
      </div>
      <div className="ai-explanation">🚀 {candidate.reason}</div>
    </div>
  );
}

// ─── Training recommendation card ─────────────────────────────────────────────
function TrainingCard({ emp }) {
  return (
    <div className="card ai-card training-card">
      <div className="card-header">
        <div>
          <div className="card-title">{emp.name}</div>
          <div className="card-subtitle">🏢 {emp.department} · Score: {emp.score}/100</div>
        </div>
        <span className={`score-badge score-poor`}>{emp.score}</span>
      </div>

      {emp.skillGaps?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Skill Gaps Identified
          </p>
          <div className="skills-row">
            {emp.skillGaps.map((s, i) => <span key={i} className="badge badge-gap">⚠️ {s}</span>)}
          </div>
        </div>
      )}

      {emp.suggestedCourses?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Suggested Courses
          </p>
          <div className="skills-row">
            {emp.suggestedCourses.map((c, i) => <span key={i} className="badge badge-course">📚 {c}</span>)}
          </div>
        </div>
      )}

      <div className="ai-interview-q">📋 {emp.trainingPlan}</div>
    </div>
  );
}

// ─── Employee ranking card ─────────────────────────────────────────────────────
function RankingCard({ emp }) {
  const tier = getScoreTier(emp.score);
  const rankEmoji = emp.rank === 1 ? "🥇" : emp.rank === 2 ? "🥈" : emp.rank === 3 ? "🥉" : `#${emp.rank}`;

  const barClass =
    emp.score >= 85 ? "progress-high"
      : emp.score >= 70 ? "progress-medium-good"
        : emp.score >= 50 ? "progress-medium"
          : "progress-low";

  return (
    <div className="card ai-card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, textAlign: "center", fontSize: emp.rank <= 3 ? "1.3rem" : "0.9rem", fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>
          {rankEmoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span className="card-title" style={{ fontSize: "0.92rem" }}>{emp.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`tier-label ${tier.cls}`} style={{ fontSize: "0.73rem" }}>{tier.label}</span>
              <span className={`score-badge ${tier.cls}`}>{emp.score}</span>
            </span>
          </div>
          <div className="progress-track" style={{ height: 5 }}>
            <div className={`progress-fill ${barClass}`} style={{ width: `${emp.score}%` }} />
          </div>
          <div className="card-subtitle" style={{ marginTop: 6 }}>{emp.feedback}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * AIPanel
 * Triggers POST /api/ai/recommend which pulls all employees from the DB,
 * sends them to OpenRouter, and returns a structured JSON with four sections.
 * Each section is rendered in its own tab within the results area.
 */
export default function AIPanel({ token }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("rankings");

  const handleGenerate = async () => {
    setError(""); setLoading(true); setResults(null);
    try {
      const { data } = await axios.post(
        `${API}/ai/recommend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(data.data);
      setActiveSection("rankings"); // default view after load
    } catch (err) {
      setError(err.response?.data?.message || "AI recommendation failed. Check your OpenRouter API key.");
    } finally {
      setLoading(false);
    }
  };

  const SECTIONS = [
    { id: "rankings", label: "🏆 Rankings", count: results?.employeeRankings?.length },
    { id: "promo", label: "🚀 Promotions", count: results?.promotionCandidates?.length },
    { id: "training", label: "📚 Training", count: results?.trainingRecommendations?.length },
    { id: "summary", label: "📊 Summary", count: null },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>AI Recommendations</h1>
        <p>Generate promotion suggestions, training plans, rankings, and feedback powered by OpenRouter.</p>
      </div>

      {/* Trigger panel */}
      <div className="card ai-trigger-card">
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>🤖 AI Performance Analysis</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Powered by OpenRouter · GPT-4o mini · Analyses all employees in your database
            </p>
          </div>
          <button
            className="btn btn-ai"
            onClick={handleGenerate}
            disabled={loading}
            style={{ flexShrink: 0 }}
          >
            {loading ? <><span className="spinner" /> Analysing...</> : "✨ Generate AI Report"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(239,68,68,0.1)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: "0.87rem" }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 16, animation: "spin 1.5s linear infinite", display: "inline-block" }}>🤖</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            AI is analysing your team...
          </h3>
          <p style={{ fontSize: "0.88rem" }}>This takes a few seconds — evaluating performance scores and generating personalised feedback.</p>
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && (
        <div className="empty-state" style={{ marginTop: 32 }}>
          <div className="empty-icon">🤖</div>
          <h3>Ready to analyse</h3>
          <p>Click "Generate AI Report" to get promotion recommendations, training plans, employee rankings, and more.</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Section tabs */}
          <div className="section-tabs">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`section-tab-btn ${activeSection === s.id ? "active" : ""}`}
                onClick={() => setActiveSection(s.id)}
              >
                {s.label}
                {s.count != null && <span className="section-tab-count">{s.count}</span>}
              </button>
            ))}
          </div>

          {/* Rankings */}
          {activeSection === "rankings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.employeeRankings?.map((emp) => (
                <RankingCard key={emp.name} emp={emp} />
              ))}
            </div>
          )}

          {/* Promotions */}
          {activeSection === "promo" && (
            results.promotionCandidates?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {results.promotionCandidates.map((c, i) => (
                  <PromotionCard key={c.name} candidate={c} rank={i + 1} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🚀</div>
                <h3>No promotion candidates identified</h3>
                <p>Employees scoring 80+ will appear here as promotion-ready.</p>
              </div>
            )
          )}

          {/* Training */}
          {activeSection === "training" && (
            results.trainingRecommendations?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {results.trainingRecommendations.map((e) => (
                  <TrainingCard key={e.name} emp={e} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No training plans needed</h3>
                <p>All employees are performing above the threshold (score ≥ 70).</p>
              </div>
            )
          )}

          {/* Summary */}
          {activeSection === "summary" && results.summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              <div className="stat-card">
                <div className="stat-value">{results.summary.totalEmployees}</div>
                <div className="stat-label">Total Employees</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#34d399" }}>{results.summary.avgScore}</div>
                <div className="stat-label">Avg. Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#fbbf24" }}>{results.summary.topPerformers}</div>
                <div className="stat-label">Top Performers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#f87171" }}>{results.summary.needsAttention}</div>
                <div className="stat-label">Needs Attention</div>
              </div>
              <div className="card" style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 10, color: "var(--accent-light)" }}>📊 Overall Team Insight</h3>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>{results.summary.overallInsight}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
