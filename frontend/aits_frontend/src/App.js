import { useEffect, useState } from "react";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentPlacementPage from "./pages/student/StudentPlacementPage";
import StudentPlacementRequestPage from "./pages/student/StudentPlacementRequestPage";
import StudentsWeeklyLogsPage from "./pages/student/StudentsWeeklyLogsPage";
import StudentsResultsPage from "./pages/student/StudentsResultsPage";
import StudentsFeedbackPage from "./pages/student/StudentsFeedbackPage";

import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorAssignmentsPage from "./pages/supervisor/SupervisorAssignmentsPage";
import SupervisorFeedbackPage from "./pages/supervisor/SupervisorFeedbackPage";
import SupervisorEvaluationsPage from "./pages/supervisor/SupervisorEvaluationsPage";
import SupervisorWeeklyLogsPage from "./pages/supervisor/SupervisorWeeklyLogsPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAssessmentsPage from "./pages/admin/AdminAssessmentsPage";

import CompaniesPage from "./pages/CompaniesPage";

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [loginRole, setLoginRole] = useState("");
  const [supervisorType, setSupervisorType] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    const savedUser = localStorage.getItem("iles_user");

    if (savedUser) {
      setLoggedInUser(JSON.parse(savedUser));
      setCurrentView("app");
    }
  }, []);

  function handleChooseLogin(role, type = "") {
    setLoginRole(role);
    setSupervisorType(type);
    setCurrentView("login");
  }

  function handleLoginSuccess(user) {
    localStorage.setItem("iles_user", JSON.stringify(user));
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

  const isStudent = loggedInUser?.role === "STUDENT";
  const isSupervisor = loggedInUser?.role === "SUPERVISOR";
  const isAdmin =
    loggedInUser?.role === "ADMINISTRATOR" ||
    loggedInUser?.is_staff ||
    loggedInUser?.is_superuser;

  function renderPage() {
    if (activePage === "dashboard") {
      if (isStudent) return <StudentDashboard />;
      if (isSupervisor) return <SupervisorDashboard />;
      if (isAdmin) return <AdminDashboard />;
    }

    if (activePage === "companies") {
      return <CompaniesPage />;
    }

    if (activePage === "placement") {
      return <StudentPlacementPage />;
    }

    if (activePage === "placementRequest") {
      return <StudentPlacementRequestPage />;
    }

    if (activePage === "weeklyLogs") {
      if (isSupervisor) return <SupervisorWeeklyLogsPage />;
      return <StudentsWeeklyLogsPage />;
    }

    if (activePage === "supervisors") {
      return <SupervisorAssignmentsPage />;
    }

    if (activePage === "feedback") {
      if (isStudent) return <StudentsFeedbackPage />;
      return <SupervisorFeedbackPage />;
    }

    if (activePage === "evaluations") {
      return <SupervisorEvaluationsPage />;
    }

    if (activePage === "results") {
      return <StudentsResultsPage />;
    }

    if (activePage === "users") {
      return <AdminUsersPage />;
    }

    if (activePage === "assessments") {
      return <AdminAssessmentsPage />;
    }

    if (isStudent) return <StudentDashboard />;
    if (isSupervisor) return <SupervisorDashboard />;
    if (isAdmin) return <AdminDashboard />;

    return <HomePage onChooseLogin={handleChooseLogin} />;
  }

  function renderNavigation() {
    return (
      <nav style={navStyle}>
        <button onClick={() => setActivePage("dashboard")}>Dashboard</button>

        {isStudent && (
          <>
            <button onClick={() => setActivePage("placement")}>
              My Placement
            </button>

            <button onClick={() => setActivePage("placementRequest")}>
              Submit Placement Details
            </button>

            <button onClick={() => setActivePage("weeklyLogs")}>
              My Weekly Logs
            </button>

            <button onClick={() => setActivePage("supervisors")}>
              My Supervisors
            </button>

            <button onClick={() => setActivePage("feedback")}>
              My Feedback
            </button>

            <button onClick={() => setActivePage("evaluations")}>
              My Evaluations
            </button>

            <button onClick={() => setActivePage("results")}>
              My Results
            </button>
          </>
        )}

        {isSupervisor && (
          <>
            <button onClick={() => setActivePage("companies")}>Companies</button>

            <button onClick={() => setActivePage("placement")}>
              Assigned Placements
            </button>

            <button onClick={() => setActivePage("weeklyLogs")}>
              Student Weekly Logs
            </button>

            <button onClick={() => setActivePage("feedback")}>Feedback</button>

            <button onClick={() => setActivePage("evaluations")}>
              Evaluations
            </button>

            <button onClick={() => setActivePage("results")}>
              Final Results
            </button>
          </>
        )}

        {isAdmin && (
          <>
            <button onClick={() => setActivePage("users")}>Users</button>

            <button onClick={() => setActivePage("companies")}>Companies</button>

            <button onClick={() => setActivePage("placement")}>
              Placements
            </button>

            <button onClick={() => setActivePage("supervisors")}>
              Supervisor Assignments
            </button>

            <button onClick={() => setActivePage("weeklyLogs")}>
              Weekly Logs
            </button>

            <button onClick={() => setActivePage("feedback")}>Feedback</button>

            <button onClick={() => setActivePage("evaluations")}>
              Evaluations
            </button>

            <button onClick={() => setActivePage("assessments")}>
              Assessments
            </button>

            <button onClick={() => setActivePage("results")}>
              Final Results
            </button>
          </>
        )}

        <span style={{ marginLeft: "auto", fontWeight: "bold" }}>
          {loggedInUser?.username} - {loggedInUser?.role}
        </span>

        <button onClick={handleLogout}>Logout</button>
      </nav>
    );
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
      {renderNavigation()}
      {renderPage()}
    </div>
  );
}

const navStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  padding: "15px",
  borderBottom: "1px solid #ddd",
  background: "#f7f7f7",
  alignItems: "center",
};

export default App;