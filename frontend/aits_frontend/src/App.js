import { useState } from "react";

import StudentDashboard from "./pages/student/StudentDashboard";
import CompaniesPage from "./pages/CompaniesPage";
import StudentPlacementPage from "./pages/student/StudentPlacementPage";
import StudentsWeeklyLogsPage from "./pages/student/StudentsWeeklyLogsPage";
import StudentsResultsPage from "./pages/student/StudentsResultsPage";
import SupervisorAssignmentsPage from "./pages/supervisor/SupervisorAssignmentsPage";
import SupervisorFeedbackPage from "./pages/supervisor/SupervisorFeedbackPage";
import SupervisorEvaluationsPage from "./pages/supervisor/SupervisorEvaluationsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return <StudentDashboard />;

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
        return <StudentDashboard />;
    }
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
      </nav>

      {renderPage()}
    </div>
  );
}

export default App;