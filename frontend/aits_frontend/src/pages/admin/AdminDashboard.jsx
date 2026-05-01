import { useEffect, useState } from "react";

import { getPlacements } from "../../api/placementsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getFinalResults } from "../../api/finalResultsApi";

import PerformanceTrendChart from "../../components/common/PerformanceTrendChart";

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
      .catch((err) =>
        setError(err.message || "Failed to load admin dashboard.")
      );
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

  function getStudentPerformanceGroups() {
    const groups = {};

    weeklyLogs.forEach((log) => {
      const isFullyAssessed =
        log.is_fully_assessed === true &&
        log.average_score !== null &&
        log.average_score !== undefined;

      if (!isFullyAssessed) {
        return;
      }

      const student = log.placement?.student;
      const company = log.placement?.company;

      if (!student?.id) {
        return;
      }

      if (!groups[student.id]) {
        groups[student.id] = {
          student,
          company,
          evaluations: [],
        };
      }

      groups[student.id].evaluations.push(log);
    });

    return Object.values(groups);
  }

  const studentPerformanceGroups = getStudentPerformanceGroups();

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>Internship Administrator Dashboard</h1>
          <p className="muted">
            Review student placement requests, monitor weekly logs, and track
            final internship results.
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <Card title="Total Placements" value={placements.length} />
        <Card title="Pending Requests" value={pendingPlacements.length} />
        <Card title="Active Placements" value={approvedPlacements.length} />
        <Card title="Weekly Logs" value={weeklyLogs.length} />
        <Card title="Submitted Logs" value={logStatusCounts.SUBMITTED || 0} />
        <Card title="Final Results" value={finalResults.length} />
      </div>

      <section className="card">
        <h2>Student Performance Trends</h2>
        <p className="muted">
          These graphs show weekly performance for students whose weekly logs
          have been assessed by both the academic supervisor and workplace
          supervisor.
        </p>

        {studentPerformanceGroups.length === 0 ? (
          <p>No fully assessed weekly logs found yet.</p>
        ) : (
          studentPerformanceGroups.map((group) => (
            <div key={group.student.id} className="info-card">
              <h3>
                {group.student.registration_number} -{" "}
                {group.student.user?.username || "Student"}
              </h3>

              <p>
                <strong>Company:</strong>{" "}
                {group.company?.company_name || "-"}
              </p>

              <p>
                <strong>Assessed Weekly Logs:</strong>{" "}
                {group.evaluations.length}
              </p>

              <PerformanceTrendChart
                evaluations={group.evaluations}
                title={`${group.student.registration_number} Performance Trend`}
              />
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>Placement Requests Submitted by Students</h2>
        <p className="muted">
          These are the company and workplace supervisor details submitted by
          students. Use these details to create or assign the workplace
          supervisor and academic supervisor.
        </p>

        {pendingPlacements.length === 0 ? (
          <p>No pending placement requests.</p>
        ) : (
          pendingPlacements.map((placement) => (
            <div key={placement.id} className="info-card">
              <h3>
                {placement.student?.registration_number} -{" "}
                {placement.student?.user?.username}
              </h3>

              <div className="details-grid">
                <div>
                  <h4>Company Details</h4>

                  <p>
                    <strong>Company:</strong>{" "}
                    {placement.company?.company_name || "-"}
                  </p>

                  <p>
                    <strong>Location:</strong>{" "}
                    {placement.company?.location || "-"}
                  </p>

                  <p>
                    <strong>Department:</strong>{" "}
                    {placement.org_department || "-"}
                  </p>

                  <p>
                    <strong>Start Date:</strong> {placement.start_date || "-"}
                  </p>

                  <p>
                    <strong>End Date:</strong> {placement.end_date || "-"}
                  </p>
                </div>

                <div>
                  <h4>Workplace Supervisor Details Submitted by Student</h4>

                  <p>
                    <strong>Name:</strong>{" "}
                    {placement.workplace_supervisor_name || "-"}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {placement.workplace_supervisor_email || "-"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {placement.workplace_supervisor_phone || "-"}
                  </p>

                  <p>
                    <strong>Title:</strong>{" "}
                    {placement.workplace_supervisor_title || "-"}
                  </p>

                  <p>
                    <strong>Department:</strong>{" "}
                    {placement.workplace_supervisor_department || "-"}
                  </p>
                </div>
              </div>

              <h4>Internship Period</h4>
              <p>
                <strong>Start Date:</strong> {placement.start_date || "-"}
              </p>
              <p>
                <strong>End Date:</strong> {placement.end_date || "-"}
              </p>

              <h4>Student Notes</h4>
              <p>{placement.student_notes || "-"}</p>

              <p className="muted">
                Next: create the workplace supervisor under Users/Supervisor
                Profiles, then assign both workplace and academic supervisors
                under Supervisor Assignments.
              </p>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>All Placements</h2>

        {placements.length === 0 ? (
          <p>No placements found.</p>
        ) : (
          placements.map((placement) => (
            <div key={placement.id} className="info-card">
              <h3>
                {placement.student?.registration_number} @{" "}
                {placement.company?.company_name}
              </h3>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`badge badge-${String(
                    placement.status || ""
                  ).toLowerCase()}`}
                >
                  {placement.status || "-"}
                </span>
              </p>

              <p>
                <strong>Student:</strong>{" "}
                {placement.student?.user?.username || "-"}
              </p>

              <p>
                <strong>Period:</strong> {placement.start_date || "-"} to{" "}
                {placement.end_date || "-"}
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="stat-card">
      <h2>{value}</h2>
      <p>{title}</p>
    </div>
  );
}

export default AdminDashboard;