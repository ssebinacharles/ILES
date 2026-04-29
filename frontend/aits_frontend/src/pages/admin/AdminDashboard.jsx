import { useEffect, useState } from "react";

import { getUsers, getStudents, getSupervisors, getAdministrators } from "../../api/usersApi";
import { getCompanies } from "../../api/companiesApi";
import { getPlacements } from "../../api/placementsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getSupervisorAssignments } from "../../api/supervisorAssignmentsApi";
import { getFeedback } from "../../api/feedbackApi";
import { getEvaluations } from "../../api/evaluationsApi";
import { getFinalResults } from "../../api/finalResultsApi";

function getCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data && Array.isArray(data.results)) return data.results.length;
  return 0;
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    students: 0,
    supervisors: 0,
    administrators: 0,
    companies: 0,
    placements: 0,
    weeklyLogs: 0,
    assignments: 0,
    feedback: 0,
    evaluations: 0,
    finalResults: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getUsers(),
      getStudents(),
      getSupervisors(),
      getAdministrators(),
      getCompanies(),
      getPlacements(),
      getWeeklyLogs(),
      getSupervisorAssignments(),
      getFeedback(),
      getEvaluations(),
      getFinalResults(),
    ])
      .then(
        ([
          users,
          students,
          supervisors,
          administrators,
          companies,
          placements,
          weeklyLogs,
          assignments,
          feedback,
          evaluations,
          finalResults,
        ]) => {
          setStats({
            users: getCount(users),
            students: getCount(students),
            supervisors: getCount(supervisors),
            administrators: getCount(administrators),
            companies: getCount(companies),
            placements: getCount(placements),
            weeklyLogs: getCount(weeklyLogs),
            assignments: getCount(assignments),
            feedback: getCount(feedback),
            evaluations: getCount(evaluations),
            finalResults: getCount(finalResults),
          });

          setLoading(false);
        }
      )
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Admin Dashboard</h1>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Admin Dashboard</h1>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Admin Dashboard</h1>
      <p>Overview of the entire Internship Logging & Evaluation System.</p>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2>{stats.users}</h2>
          <p>All Users</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.students}</h2>
          <p>Student Profiles</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.supervisors}</h2>
          <p>Supervisor Profiles</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.administrators}</h2>
          <p>Administrator Profiles</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.companies}</h2>
          <p>Companies</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.placements}</h2>
          <p>Placements</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.weeklyLogs}</h2>
          <p>Weekly Logs</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.assignments}</h2>
          <p>Supervisor Assignments</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.feedback}</h2>
          <p>Feedback Records</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.evaluations}</h2>
          <p>Evaluations</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.finalResults}</h2>
          <p>Final Results</p>
        </div>
      </div>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginTop: "20px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "20px",
  background: "#f9f9f9",
};

export default AdminDashboard;