import { useEffect, useState } from "react";

import { getSupervisorAssignments } from "../../api/supervisorAssignmentsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getFeedback } from "../../api/feedbackApi";
import { getEvaluations } from "../../api/evaluationsApi";

function getCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data && Array.isArray(data.results)) return data.results.length;
  return 0;
}

function SupervisorDashboard() {
  const [stats, setStats] = useState({
    assignments: 0,
    weeklyLogs: 0,
    feedback: 0,
    evaluations: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getSupervisorAssignments(),
      getWeeklyLogs(),
      getFeedback(),
      getEvaluations(),
    ])
      .then(([assignments, weeklyLogs, feedback, evaluations]) => {
        setStats({
          assignments: getCount(assignments),
          weeklyLogs: getCount(weeklyLogs),
          feedback: getCount(feedback),
          evaluations: getCount(evaluations),
        });

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Supervisor Dashboard</h1>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Supervisor Dashboard</h1>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Supervisor Dashboard</h1>
      <p>Overview of supervisor internship activities.</p>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2>{stats.assignments}</h2>
          <p>Supervisor Assignments</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.weeklyLogs}</h2>
          <p>Weekly Logs</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.feedback}</h2>
          <p>Feedback Records</p>
        </div>

        <div style={cardStyle}>
          <h2>{stats.evaluations}</h2>
          <p>Evaluations</p>
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

export default SupervisorDashboard;