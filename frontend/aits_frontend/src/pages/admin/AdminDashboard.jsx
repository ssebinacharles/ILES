import { useEffect, useState } from "react";

import { getPlacements } from "../../api/placementsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getFinalResults } from "../../api/finalResultsApi";

import PerformanceTrendChart from "../../components/common/PerformanceTrendChart";

import {
  asArray,
  countByStatus,
  formatDateTime,
} from "../../utils/dashboardHelpers";

function AdminDashboard() {
  const [placements, setPlacements] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [finalResults, setFinalResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadDashboard() {
    setLoading(true);
    setError("");

    Promise.all([getPlacements(), getWeeklyLogs(), getFinalResults()])
      .then(([placementData, logData, resultData]) => {
        setPlacements(asArray(placementData));
        setWeeklyLogs(asArray(logData));
        setFinalResults(asArray(resultData));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load admin dashboard.");
        setLoading(false);
      });
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

  const completedPlacements = placements.filter(
    (placement) => placement.status === "COMPLETED"
  );

  const rejectedPlacements = placements.filter(
    (placement) => placement.status === "REJECTED"
  );

  const logStatusCounts = countByStatus(weeklyLogs);

  function displayScore(value) {
    if (value === null || value === undefined || value === "") {
      return "Not available";
    }

    return `${value}%`;
  }

  function getPlacementLogs(placementId) {
    return weeklyLogs.filter((log) => log.placement?.id === placementId);
  }

  function getPlacementFinalResult(placementId) {
    return finalResults.find((result) => result.placement?.id === placementId);
  }

  function getSubmittedLogsCount(placementId) {
    return getPlacementLogs(placementId).filter(
      (log) => log.status !== "DRAFT"
    ).length;
  }

  function getFeedbackCount(placementId) {
    return getPlacementLogs(placementId).reduce((total, log) => {
      return total + asArray(log.feedback_entries).length;
    }, 0);
  }

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

  if (loading) {
    return (
      <div className="page">
        <h1>Internship Administrator Dashboard</h1>
        <p className="muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>Internship Administrator Dashboard</h1>

          <p className="muted">
            Review student placement requests, monitor weekly logs, track
            supervisor feedback, and view final internship results.
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <Card title="Total Placements" value={placements.length} />
        <Card title="Pending Requests" value={pendingPlacements.length} />
        <Card title="Active Placements" value={approvedPlacements.length} />
        <Card title="Completed Placements" value={completedPlacements.length} />
        <Card title="Rejected Placements" value={rejectedPlacements.length} />
        <Card title="Weekly Logs" value={weeklyLogs.length} />
        <Card title="Submitted Logs" value={logStatusCounts.SUBMITTED || 0} />
        <Card title="Approved Logs" value={logStatusCounts.APPROVED || 0} />
        <Card title="Final Results" value={finalResults.length} />
      </div>

      <section className="card">
        <h2>Placement Requests Submitted by Students</h2>

        <p className="muted">
          These are company details, internship period details, and workplace
          supervisor details submitted by students. Use these details to create
          or assign the workplace supervisor and academic supervisor.
        </p>

        {pendingPlacements.length === 0 ? (
          <p>No pending placement requests.</p>
        ) : (
          pendingPlacements.map((placement) => (
            <div key={placement.id} className="info-card">
              <h3>
                {placement.student?.registration_number || "-"} -{" "}
                {placement.student?.user?.username || "Student"}
              </h3>

              <p>
                <strong>Request Submitted At:</strong>{" "}
                {placement.requested_at
                  ? formatDateTime(placement.requested_at)
                  : "-"}
              </p>

              <div className="details-grid">
                <div>
                  <h4>Student Details</h4>

                  <p>
                    <strong>Name:</strong>{" "}
                    {placement.student?.user?.username || "-"}
                  </p>

                  <p>
                    <strong>Registration Number:</strong>{" "}
                    {placement.student?.registration_number || "-"}
                  </p>

                  <p>
                    <strong>Course:</strong>{" "}
                    {placement.student?.course || "-"}
                  </p>

                  <p>
                    <strong>Department:</strong>{" "}
                    {placement.student?.department || "-"}
                  </p>
                </div>

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
                    <strong>Organization Department:</strong>{" "}
                    {placement.org_department || "-"}
                  </p>

                  <p>
                    <strong>Internship Period:</strong>{" "}
                    {placement.start_date || "-"} to{" "}
                    {placement.end_date || "-"}
                  </p>
                </div>

                <div>
                  <h4>Workplace Supervisor Details</h4>

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

              <h4>Student Notes</h4>
              <p>{placement.student_notes || "-"}</p>

              <p className="muted">
                Next step: create or confirm the workplace supervisor account,
                then assign both the workplace supervisor and academic
                supervisor under Supervisor Assignments.
              </p>
            </div>
          ))
        )}
      </section>

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
        <h2>All Placements</h2>

        {placements.length === 0 ? (
          <p>No placements found.</p>
        ) : (
          placements.map((placement) => {
            const placementLogs = getPlacementLogs(placement.id);
            const finalResult = getPlacementFinalResult(placement.id);
            const submittedLogsCount = getSubmittedLogsCount(placement.id);
            const feedbackCount = getFeedbackCount(placement.id);

            return (
              <div key={placement.id} className="info-card">
                <h3>
                  {placement.student?.registration_number || "-"} @{" "}
                  {placement.company?.company_name || "-"}
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
                  <strong>Company:</strong>{" "}
                  {placement.company?.company_name || "-"}
                </p>

                <p>
                  <strong>Period:</strong> {placement.start_date || "-"} to{" "}
                  {placement.end_date || "-"}
                </p>

                <p>
                  <strong>Workplace Supervisor Submitted:</strong>{" "}
                  {placement.workplace_supervisor_name || "Not provided"}
                </p>

                <p>
                  <strong>Total Weekly Logs:</strong> {placementLogs.length}
                </p>

                <p>
                  <strong>Submitted Logs:</strong> {submittedLogsCount}
                </p>

                <p>
                  <strong>Feedback Received:</strong> {feedbackCount}
                </p>

                <p>
                  <strong>Final Mark:</strong>{" "}
                  {finalResult
                    ? displayScore(finalResult.final_mark)
                    : "Not published"}
                </p>
              </div>
            );
          })
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