import { useState } from "react";
import "./index.css";
import AuthPage from "./components/AuthPage";
import Navbar from "./components/Navbar";
import EmployeeForm from "./components/EmployeeForm";
import EmployeeList from "./components/EmployeeList";
import AIPanel from "./components/AIPanel";
import Analytics from "./components/Analytics";

/**
 * App — root component
 *
 * Auth flow:
 *  1. On mount, check localStorage for a saved JWT and user object.
 *  2. If found, skip the login screen and go directly to the dashboard.
 *  3. On logout, clear localStorage and reset state to show AuthPage again.
 *
 * The token is passed down to every component that hits a protected API route
 * so that axios can include it in the Authorization header.
 */
export default function App() {
  // Restore session from localStorage so users stay logged in after refresh
  const [token, setToken] = useState(() => localStorage.getItem("emp_token") || null);
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("emp_user")); } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState("employees");
  // refreshKey forces EmployeeList to re-mount (and refetch) after an add
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogin = (jwt, userData) => {
    setToken(jwt);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("emp_token");
    localStorage.removeItem("emp_user");
    setToken(null);
    setUser(null);
    setActiveTab("employees");
  };

  // Not authenticated — show the login/signup page
  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-wrapper">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {activeTab === "employees" && (
          <EmployeeList key={refreshKey} token={token} />
        )}

        {activeTab === "add" && (
          <EmployeeForm
            token={token}
            onSuccess={() => {
              setRefreshKey((k) => k + 1);
              setActiveTab("employees");
            }}
          />
        )}

        {activeTab === "ai" && (
          <AIPanel token={token} />
        )}

        {activeTab === "analytics" && (
          <Analytics token={token} />
        )}
      </main>
    </div>
  );
}
