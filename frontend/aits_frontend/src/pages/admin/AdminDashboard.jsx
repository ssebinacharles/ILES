import { useEffect, useState } from "react";

import { getPlacements } from "../../api/placementsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getFinalResults } from "../../api/finalResultsApi";

import { asArray, countByStatus } from "../../utils/dashboardHelpers";

function AdminDashboard() {
  const [placements, setPlacements] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [finalResults, setFinalResults] = useState([]);
  const [error, setError] = useState("");

  function loadDashboard() {
    Promise.all([getPlacements(), getWeeklyLogs(), getFinalResults()])
      .then(([placementData, logData, resultData]) => {
        setPlacements(asArray(placementData));
        setWeeklyLogs(asArray(logData));
        setFinalResults(asArray(resultData));
      })
      .catch((err) => setError(err.message || "Failed to load admin dashboard."));
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const pendingPlacements = placements.filter(
    (placement) => placement.status === "PENDING"
  );

  const approvedPlacements = placements.filter(
    (placement) =>
      placement.status === "APPROVED" || placement.status === "IN_PROGRESS"
  );

  const logStatusCounts = countByStatus(weeklyLogs);

  return (
    <div style={{ padding: "30px" }}>
      <h1>Internship Administrator Dashboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={gridStyle}>
        <Card title="Total Placements" value={placements.length} />
        <Card title="Pending Requests" value={pendingPlacements.length} />
        <Card title="Active Placements" value={approvedPlacements.length} />
        <Card title="Weekly Logs" value={weeklyLogs.length} />
        <Card title="Submitted Logs" value={logStatusCounts.SUBMITTED || 0} />
        <Card title="Final Results" value={finalResults.length} />
      </div>

      <section style={sectionStyle}>
        <h2>Placement Requests Submitted by Students</h2>
        <p>
          These are the company and workplace supervisor details submitted by students.
          Use these details to create or assign the workplace supervisor and academic supervisor.
        </p>

        {pendingPlacements.length === 0 ? (
          <p>No pending placement requests.</p>
        ) : (
          pendingPlacements.map((placement) => (
            <div key={placement.id} style={boxStyle}>
              <h3>
                {placement.student?.registration_number} -{" "}
                {placement.student?.user?.username}
              </h3>

              <h4>Company Details</h4>
              <p><strong>Company:</strong> {placement.company?.company_name}</p>
              <p><strong>Location:</strong> {placement.company?.location}</p>
              <p><strong>Department:</strong> {placement.org_department || "-"}</p>
              <p><strong>Start Date:</strong> {placement.start_date}</p>
              <p><strong>End Date:</strong> {placement.end_date}</p>

              <h4>Workplace Supervisor Details Submitted by Student</h4>
              <p><strong>Name:</strong> {placement.workplace_supervisor_name || "-"}</p>
              <p><strong>Email:</strong> {placement.workplace_supervisor_email || "-"}</p>
              <p><strong>Phone:</strong> {placement.workplace_supervisor_phone || "-"}</p>
              <p><strong>Title:</strong> {placement.workplace_supervisor_title || "-"}</p>
              <p><strong>Department:</strong> {placement.workplace_supervisor_department || "-"}</p>

              <h4>Internship Period</h4>
              <p><strong>Start Date:</strong> {placement.start_date || "-"}</p>
              <p><strong>End Date:</strong> {placement.end_date || "-"}</p>

              <h4>Student Notes</h4>
              <p>{placement.student_notes || "-"}</p>

              <p style={{ color: "#666" }}>
                Next: create the workplace supervisor under Users/Supervisor Profiles,
                then assign both workplace and academic supervisors under Supervisor Assignments.
              </p>
            </div>
          ))
        )}
      </section>

      <section style={sectionStyle}>
        <h2>All Placements</h2>

        {placements.length === 0 ? (
          <p>No placements found.</p>
        ) : (
          placements.map((placement) => (
            <div key={placement.id} style={boxStyle}>
              <h3>
                {placement.student?.registration_number} @{" "}
                {placement.company?.company_name}
              </h3>
              <p><strong>Status:</strong> {placement.status}</p>
              <p><strong>Student:</strong> {placement.student?.user?.username}</p>
              <p><strong>Period:</strong> {placement.start_date} to {placement.end_date}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={cardStyle}>
      <h2>{value}</h2>
      <p>{title}</p>
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

const sectionStyle = {
  marginTop: "30px",
};

const boxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "14px",
  background: "#fff",
};

export default AdminDashboard;