import { useEffect, useState } from "react";

import { getSupervisorAssignments } from "../../api/supervisorAssignmentsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getFeedback } from "../../api/feedbackApi";
import { getEvaluations } from "../../api/evaluationsApi";

import {
  asArray,
  countByStatus,
  getPlacementIdFromItem,
  getStoredUser,
  isMySupervisorAssignment,
  uniqueById,
} from "../../utils/dashboardHelpers";

function WorkplaceSupervisorDashboard() {
  const [dashboard, setDashboard] = useState({
    assignments: [],
    students: [],
    weeklyLogs: [],
    pendingLogs: [],
    feedback: [],
    evaluations: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getStoredUser();

  useEffect(() => {
    Promise.all([
      getSupervisorAssignments(),
      getWeeklyLogs(),
      getFeedback(),
      getEvaluations(),
    ])
      .then(([assignmentsData, logsData, feedbackData, evaluationsData]) => {
        const assignments = asArray(assignmentsData).filter((assignment) =>
          isMySupervisorAssignment(assignment, user, "WORKPLACE")
        );

        const placementIds = assignments.map((assignment) =>
          getPlacementIdFromItem(assignment)
        );

        const students = uniqueById(
          assignments
            .map((assignment) => assignment.placement?.student)
            .filter(Boolean)
        );

        const weeklyLogs = asArray(logsData).filter((log) =>
          placementIds.includes(getPlacementIdFromItem(log))
        );

        const pendingLogs = weeklyLogs.filter((log) =>
          ["SUBMITTED", "UNDER_REVIEW"].includes(log.status)
        );

        const feedback = asArray(feedbackData).filter((entry) => {
          const supervisor = entry.supervisor;
          return (
            supervisor?.id === user?.profile?.profile_id ||
            supervisor?.user?.id === user?.id
          );
        });

        const evaluations = asArray(evaluationsData).filter((evaluation) => {
          const evaluator = evaluation.evaluator;
          return (
            evaluator?.id === user?.profile?.profile_id ||
            evaluator?.user?.id === user?.id ||
            placementIds.includes(getPlacementIdFromItem(evaluation))
          );
        });

        setDashboard({
          assignments,
          students,
          weeklyLogs,
          pendingLogs,
          feedback,
          evaluations,
        });

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load dashboard.");
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <Page>
        <h1>Workplace Supervisor Dashboard</h1>

        <div className="card">
          <p>Loading dashboard...</p>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <h1>Workplace Supervisor Dashboard</h1>

        <p className="error">Error: {error}</p>
      </Page>
    );
  }

  const logStatusCounts = countByStatus(dashboard.weeklyLogs);

  return (
    <Page>
      <div className="dashboard-header">
        <div>
          <h1>Workplace Supervisor Dashboard</h1>
          <p className="muted">
            Review assigned interns, weekly logs, feedback and workplace
            assessments.
          </p>
        </div>
      </div>

      <Grid>
        <Card title="Assigned Interns" value={dashboard.students.length} />
        <Card title="Assignments" value={dashboard.assignments.length} />
        <Card title="Weekly Logs" value={dashboard.weeklyLogs.length} />
        <Card title="Pending Reviews" value={dashboard.pendingLogs.length} />
        <Card title="Approved Logs" value={logStatusCounts.APPROVED || 0} />
        <Card title="Rejected Logs" value={logStatusCounts.REJECTED || 0} />
        <Card title="Feedback Given" value={dashboard.feedback.length} />
        <Card title="Evaluations" value={dashboard.evaluations.length} />
      </Grid>

      <Section title="Assigned Interns">
        {dashboard.students.length === 0 ? (
          <p>No assigned interns found.</p>
        ) : (
          dashboard.assignments.map((assignment) => (
            <ListItem key={assignment.id}>
              <h3>
                {assignment.placement?.student?.registration_number || "Intern"}
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
                <strong>Assignment Role:</strong>{" "}
                <span className="badge badge-submitted">
                  {assignment.assignment_role || "-"}
                </span>
              </p>

              <p>
                <strong>Active:</strong>{" "}
                <span
                  className={
                    assignment.is_active
                      ? "badge badge-approved"
                      : "badge badge-rejected"
                  }
                >
                  {assignment.is_active ? "Yes" : "No"}
                </span>
              </p>
            </ListItem>
          ))
        )}
      </Section>

      <Section title="Logs Pending Review">
        {dashboard.pendingLogs.length === 0 ? (
          <p>No logs pending review.</p>
        ) : (
          dashboard.pendingLogs.map((log) => (
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
                <span className={`badge badge-${String(log.status).toLowerCase()}`}>
                  {log.status}
                </span>
              </p>
            </ListItem>
          ))
        )}
      </Section>

      <Section title="Workplace Evaluations">
        {dashboard.evaluations.length === 0 ? (
          <p>No workplace evaluations found.</p>
        ) : (
          dashboard.evaluations.map((evaluation) => (
            <ListItem key={evaluation.id}>
              <h3>{evaluation.evaluation_type}</h3>

              <p>
                <strong>Student:</strong>{" "}
                {evaluation.placement?.student?.registration_number || "-"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`badge badge-${String(
                    evaluation.status
                  ).toLowerCase()}`}
                >
                  {evaluation.status}
                </span>
              </p>

              <p>
                <strong>Weighted Score:</strong> {evaluation.weighted_score}
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

export default WorkplaceSupervisorDashboard;