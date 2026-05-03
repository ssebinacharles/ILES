import { useEffect, useState } from "react";

import { getSupervisorAssignments } from "../../api/supervisorAssignmentsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getFeedback } from "../../api/feedbackApi";
import { getEvaluations } from "../../api/evaluationsApi";

import {
  asArray,
  countByStatus,
  formatDateTime,
  getPlacementIdFromItem,
  getStoredUser,
  getUserProfileId,
  isMySupervisorAssignment,
  uniqueById,
} from "../../utils/dashboardHelpers";

function AcademicSupervisorDashboard() {
  const [user] = useState(() => getStoredUser());

  const [dashboard, setDashboard] = useState({
    assignments: [],
    students: [],
    weeklyLogs: [],
    submittedLogs: [],
    feedback: [],
    evaluations: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadDashboard() {
    setLoading(true);
    setError("");

    Promise.all([
      getSupervisorAssignments(),
      getWeeklyLogs(),
      getFeedback(),
      getEvaluations(),
    ])
      .then(([assignmentsData, logsData, feedbackData, evaluationsData]) => {
        const assignments = asArray(assignmentsData).filter((assignment) =>
          isMySupervisorAssignment(assignment, user, "ACADEMIC")
        );

        const placementIds = assignments
          .map((assignment) => getPlacementIdFromItem(assignment))
          .filter(Boolean);

        const students = uniqueById(
          assignments
            .map((assignment) => assignment.placement?.student)
            .filter(Boolean)
        );

        const weeklyLogs = asArray(logsData).filter((log) =>
          placementIds.includes(getPlacementIdFromItem(log))
        );

        const submittedLogs = weeklyLogs.filter((log) =>
          ["SUBMITTED", "UNDER_REVIEW"].includes(log.status)
        );

        const profileId = getUserProfileId(user);

        const feedback = asArray(feedbackData).filter((entry) => {
          const supervisor = entry.supervisor;

          return (
            supervisor?.id === profileId ||
            supervisor?.user?.id === user?.id ||
            supervisor?.user?.username === user?.username ||
            supervisor?.user?.email === user?.email
          );
        });

        const evaluations = asArray(evaluationsData).filter((evaluation) => {
          const evaluator = evaluation.evaluator;
          const placementId = getPlacementIdFromItem(evaluation);

          return (
            evaluator?.id === profileId ||
            evaluator?.user?.id === user?.id ||
            evaluator?.user?.username === user?.username ||
            evaluator?.user?.email === user?.email ||
            placementIds.includes(placementId)
          );
        });

        setDashboard({
          assignments,
          students,
          weeklyLogs,
          submittedLogs,
          feedback,
          evaluations,
        });

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load academic supervisor dashboard.");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function displayScore(value) {
    if (value === null || value === undefined || value === "") {
      return "Not available";
    }

    return `${value}%`;
  }

  function getFeedbackCount(log) {
    return asArray(log.feedback_entries).length;
  }

  if (loading) {
    return (
      <Page>
        <h1>Academic Supervisor Dashboard</h1>

        <div className="card">
          <p>Loading dashboard...</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <h1>Academic Supervisor Dashboard</h1>

        <p className="error">Error: {error}</p>

        <button onClick={loadDashboard}>Try Again</button>
      </Page>
    );
  }

  const logStatusCounts = countByStatus(dashboard.weeklyLogs);

  return (
    <Page>
      <div className="dashboard-header">
        <div>
          <h1>Academic Supervisor Dashboard</h1>

          <p className="muted">
            Monitor assigned students, review weekly logs, give academic
            feedback, and track academic evaluation records.
          </p>
        </div>
      </div>

      <Grid>
        <Card title="Assigned Students" value={dashboard.students.length} />
        <Card title="Assigned Placements" value={dashboard.assignments.length} />
        <Card title="Weekly Logs" value={dashboard.weeklyLogs.length} />
        <Card title="Submitted Logs" value={logStatusCounts.SUBMITTED || 0} />
        <Card title="Approved Logs" value={logStatusCounts.APPROVED || 0} />
        <Card title="Rejected Logs" value={logStatusCounts.REJECTED || 0} />
        <Card title="Feedback Given" value={dashboard.feedback.length} />
        <Card
          title="Academic Evaluations"
          value={dashboard.evaluations.length}
        />
      </Grid>

      <Section title="Assigned Students">
        {dashboard.assignments.length === 0 ? (
          <p>No assigned students found.</p>
        ) : (
          dashboard.assignments.map((assignment) => (
            <ListItem key={assignment.id}>
              <h3>
                {assignment.placement?.student?.registration_number ||
                  "Student"}
              </h3>

              <p>
                <strong>Student:</strong>{" "}
                {assignment.placement?.student?.user?.username || "-"}
              </p>

              <p>
                <strong>Company:</strong>{" "}
                {assignment.placement?.company?.company_name || "-"}
              </p>

              <p>
                <strong>Internship Period:</strong>{" "}
                {assignment.placement?.start_date || "-"} to{" "}
                {assignment.placement?.end_date || "-"}
              </p>

              <p>
                <strong>Assignment Role:</strong>{" "}
                {assignment.assignment_role || "-"}
              </p>

              <p>
                <strong>Assigned At:</strong>{" "}
                {assignment.assigned_at
                  ? formatDateTime(assignment.assigned_at)
                  : "-"}
              </p>

              <p>
                <strong>Placement Status:</strong>{" "}
                <span
                  className={`badge badge-${String(
                    assignment.placement?.status || ""
                  ).toLowerCase()}`}
                >
                  {assignment.placement?.status || "-"}
                </span>
              </p>

              <p>
                <strong>Active Assignment:</strong>{" "}
                {assignment.is_active ? "Yes" : "No"}
              </p>
            </ListItem>
          ))
        )}
      </Section>

      <Section title="Submitted Logs for Review">
        {dashboard.submittedLogs.length === 0 ? (
          <p>No submitted logs awaiting review.</p>
        ) : (
          dashboard.submittedLogs.map((log) => (
            <ListItem key={log.id}>
              <h3>
                Week {log.week_number}: {log.title}
              </h3>

              <p>
                <strong>Student:</strong>{" "}
                {log.placement?.student?.registration_number || "-"}
              </p>

              <p>
                <strong>Company:</strong>{" "}
                {log.placement?.company?.company_name || "-"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`badge badge-${String(
                    log.status || ""
                  ).toLowerCase()}`}
                >
                  {log.status || "-"}
                </span>
              </p>

              <p>
                <strong>Submitted At:</strong>{" "}
                {log.submitted_at
                  ? formatDateTime(log.submitted_at)
                  : "Not submitted yet"}
              </p>

              <p>
                <strong>Academic Supervisor Score:</strong>{" "}
                {displayScore(log.academic_score)}
              </p>

              <p>
                <strong>Workplace Supervisor Score:</strong>{" "}
                {displayScore(log.workplace_score)}
              </p>

              <p>
                <strong>Final Weekly Log Mark:</strong>{" "}
                {displayScore(log.average_score)}
              </p>

              <p>
                <strong>Feedback Entries:</strong> {getFeedbackCount(log)}
              </p>

              <h4>Student Activities</h4>

              <p>
                <strong>Monday:</strong> {log.monday_activities || "-"}
              </p>

              <p>
                <strong>Tuesday:</strong> {log.tuesday_activities || "-"}
              </p>

              <p>
                <strong>Wednesday:</strong>{" "}
                {log.wednesday_activities || "-"}
              </p>

              <p>
                <strong>Thursday:</strong> {log.thursday_activities || "-"}
              </p>

              <p>
                <strong>Friday:</strong> {log.friday_activities || "-"}
              </p>

              <p>
                <strong>Challenges:</strong> {log.challenges || "-"}
              </p>

              <p>
                <strong>Lessons Learned:</strong>{" "}
                {log.lessons_learned || "-"}
              </p>
            </ListItem>
          ))
        )}
      </Section>

      <Section title="Feedback Given by You">
        {dashboard.feedback.length === 0 ? (
          <p>No feedback submitted yet.</p>
        ) : (
          dashboard.feedback.map((feedback) => (
            <ListItem key={feedback.id}>
              <h3>{feedback.decision}</h3>

              <p>
                <strong>Weekly Log:</strong>{" "}
                {feedback.weekly_log
                  ? `Week ${feedback.weekly_log.week_number} - ${feedback.weekly_log.title}`
                  : "-"}
              </p>

              <p>
                <strong>Student:</strong>{" "}
                {feedback.weekly_log?.registration_number || "-"}
              </p>

              <p>
                <strong>Company:</strong>{" "}
                {feedback.weekly_log?.company_name || "-"}
              </p>

              <p>
                <strong>Feedback Sent At:</strong>{" "}
                {feedback.created_at
                  ? formatDateTime(feedback.created_at)
                  : "-"}
              </p>

              <p>
                <strong>Score:</strong> {displayScore(feedback.score)}
              </p>

              <p>
                <strong>Comment:</strong> {feedback.comment || "-"}
              </p>
            </ListItem>
          ))
        )}
      </Section>

      <Section title="Academic Evaluation Records">
        {dashboard.evaluations.length === 0 ? (
          <p>No academic evaluations found.</p>
        ) : (
          dashboard.evaluations.map((evaluation) => (
            <ListItem key={evaluation.id}>
              <h3>{evaluation.evaluation_type}</h3>

              <p>
                <strong>Student:</strong>{" "}
                {evaluation.placement?.student?.registration_number || "-"}
              </p>

              <p>
                <strong>Company:</strong>{" "}
                {evaluation.placement?.company?.company_name || "-"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`badge badge-${String(
                    evaluation.status || ""
                  ).toLowerCase()}`}
                >
                  {evaluation.status || "-"}
                </span>
              </p>

              <p>
                <strong>Submitted At:</strong>{" "}
                {evaluation.submitted_at
                  ? formatDateTime(evaluation.submitted_at)
                  : "Not submitted yet"}
              </p>

              <p>
                <strong>Total Score:</strong>{" "}
                {displayScore(evaluation.total_score)}
              </p>

              <p>
                <strong>Weighted Score:</strong>{" "}
                {displayScore(evaluation.weighted_score)}
              </p>

              <p>
                <strong>Remarks:</strong> {evaluation.remarks || "-"}
              </p>
            </ListItem>
          ))
        )}
      </Section>
    </Page>
  );
}

function Page({ children }) {
  return <div className="page">{children}</div>;
}

function Grid({ children }) {
  return <div className="dashboard-grid">{children}</div>;
}

function Card({ title, value }) {
  return (
    <div className="stat-card">
      <h2>{value}</h2>
      <p>{title}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ListItem({ children }) {
  return <div className="info-card">{children}</div>;
}

export default AcademicSupervisorDashboard;