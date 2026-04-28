import { useEffect, useState } from "react";

import { getCompanies } from "../../api/companiesApi";
import { getPlacements } from "../../api/placementsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getFinalResults } from "../../api/finalResultsApi";

function getCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data && Array.isArray(data.results)) return data.results.length;
  return 0;
}

function StudentDashboard() {
  const [stats, setStats] = useState({
    companies: 0,
    placements: 0,
    weeklyLogs: 0,
    results: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getCompanies(),
      getPlacements(),
      getWeeklyLogs(),
      getFinalResults(),
    ])
      .then(([companies, placements, weeklyLogs, results]) => {
        setStats({
          companies: getCount(companies),
          placements: getCount(placements),
          weeklyLogs: getCount(weeklyLogs),
          results: getCount(results),
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
        <h1>Student Dashboard</h1>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Student Dashboard</h1>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Student Dashboard</h1>
      <p>Overview of internship activity.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
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
          <h2>{stats.results}</h2>
          <p>Final Results</p>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "20px",
  background: "#f9f9f9",
};

export default StudentDashboard;