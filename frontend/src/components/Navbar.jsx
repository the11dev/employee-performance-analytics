const TABS = [
  { id: "employees", label: "Employees", icon: "👥" },
  { id: "add", label: "Add Employee", icon: "➕" },
  { id: "ai", label: "AI Report", icon: "🤖" },
  { id: "analytics", label: "Analytics", icon: "📊" },
];

/**
 * Navbar
 * Sticky top bar with brand, tab navigation, and logout button.
 * The user's name is displayed in a small chip when logged in.
 */
export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">📈</div>
        PerformAI
      </div>

      <div className="navbar-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* User session badge + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {user && (
          <span className="user-chip">
            👤 {user.name?.split(" ")[0]}
            <span className="user-chip-role">{user.role}</span>
          </span>
        )}
        <button className="btn btn-secondary btn-sm" onClick={onLogout} title="Logout">
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
