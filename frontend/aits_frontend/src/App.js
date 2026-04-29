import { useEffect, useState } from "react";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

import StudentDashboard from "./pages/student/StudentDashboard";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

import CompaniesPage from "./pages/CompaniesPage";
import StudentPlacementPage from "./pages/student/StudentPlacementPage";
import StudentsWeeklyLogsPage from "./pages/student/StudentsWeeklyLogsPage";
import StudentsResultsPage from "./pages/student/StudentsResultsPage";

import SupervisorAssignmentsPage from "./pages/supervisor/SupervisorAssignmentsPage";
import SupervisorFeedbackPage from "./pages/supervisor/SupervisorFeedbackPage";
import SupervisorEvaluationsPage from "./pages/supervisor/SupervisorEvaluationsPage";

import AdminUsersPage from "./pages/admin/AdminUsersPage";

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [loginRole, setLoginRole] = useState("");
  const [supervisorType, setSupervisorType] = useState("");

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    const savedUser = localStorage.getItem("iles_user");

    if (savedUser) {
      const user = JSON.parse(savedUser);
      setLoggedInUser(user);
      setCurrentView("app");
    }
  }, []);

  function handleChooseLogin(role, type = "") {
    setLoginRole(role);
    setSupervisorType(type);
    setCurrentView("login");
  }

  function handleLoginSuccess(user) {
    setLoggedInUser(user);
    setCurrentView("app");
    setActivePage("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("iles_user");
    setLoggedInUser(null);
    setCurrentView("home");
    setActivePage("dashboard");
  }

  function renderDashboard() {
    if (!loggedInUser) return <HomePage onChooseLogin={handleChooseLogin} />;

    if (loggedInUser.is_superuser || loggedInUser.is_staff) {
      return <AdminDashboard />;
    }

    if (loggedInUser.role === "STUDENT") {
      return <StudentDashboard />;
    }

    if (loggedInUser.role === "SUPERVISOR") {
      return <SupervisorDashboard />;
    }

    if (loggedInUser.role === "ADMINISTRATOR") {
      return <AdminDashboard />;
    }

    return <StudentDashboard />;
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return renderDashboard();

      case "companies":
        return <CompaniesPage />;

      case "placements":
        return <StudentPlacementPage />;

      case "weeklyLogs":
        return <StudentsWeeklyLogsPage />;

      case "results":
        return <StudentsResultsPage />;

      case "assignments":
        return <SupervisorAssignmentsPage />;

      case "feedback":
        return <SupervisorFeedbackPage />;

      case "evaluations":
        return <SupervisorEvaluationsPage />;

      case "users":
        return <AdminUsersPage />;

      default:
        return renderDashboard();
    }
  }

  function getUserLabel() {
    if (!loggedInUser) return "";

    if (loggedInUser.is_superuser || loggedInUser.is_staff) {
      return `${loggedInUser.username} - System Admin`;
    }

    if (loggedInUser.role === "SUPERVISOR") {
      const type = loggedInUser.profile?.supervisor_type || "Supervisor";
      return `${loggedInUser.username} - ${type}`;
    }

    return `${loggedInUser.username} - ${loggedInUser.role}`;
  }

  if (currentView === "home") {
    return <HomePage onChooseLogin={handleChooseLogin} />;
  }

  if (currentView === "login") {
    return (
      <LoginPage
        loginRole={loginRole}
        supervisorType={supervisorType}
        onLoginSuccess={handleLoginSuccess}
        onBack={() => setCurrentView("home")}
      />
    );
  }

  return (
    <div>
      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          padding: "15px",
          borderBottom: "1px solid #ddd",
          background: "#f7f7f7",
          alignItems: "center",
        }}
      >
        <button onClick={() => setActivePage("dashboard")}>
          Dashboard
        </button>

        <button onClick={() => setActivePage("companies")}>
          Companies
        </button>

        <button onClick={() => setActivePage("placements")}>
          Placements
        </button>

        <button onClick={() => setActivePage("weeklyLogs")}>
          Weekly Logs
        </button>

        <button onClick={() => setActivePage("results")}>
          Results
        </button>

        <button onClick={() => setActivePage("assignments")}>
          Supervisor Assignments
        </button>

        <button onClick={() => setActivePage("feedback")}>
          Feedback
        </button>

        <button onClick={() => setActivePage("evaluations")}>
          Evaluations
        </button>

        <button onClick={() => setActivePage("users")}>
          Users
        </button>

        <span style={{ marginLeft: "auto", fontWeight: "bold" }}>
          {getUserLabel()}
        </span>

        <button onClick={handleLogout}>Logout</button>
      </nav>

      {renderPage()}
    </div>
  );
}

export default App;