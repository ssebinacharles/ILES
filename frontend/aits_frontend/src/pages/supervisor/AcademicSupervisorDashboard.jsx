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

function AcademicSupervisorDashboard() {
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
          isMySupervisorAssignment(assignment, user, "ACADEMIC")
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

        const submittedLogs = weeklyLogs.filter((log) =>
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
          submittedLogs,
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
            Monitor assigned students, review weekly logs, give feedback and
            submit academic evaluations.
          </p>
        </div>
      </div>

      <Grid>
        <Card title="Assigned Students" value={dashboard.students.length} />
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
        {dashboard.students.length === 0 ? (
          <p>No assigned students found.</p>
        ) : (
          dashboard.assignments.map((assignment) => (
            <ListItem key={assignment.id}>
              <h3>
                {assignment.placement?.student?.registration_number || "Student"}
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
                <strong>Placement Status:</strong>{" "}
                <span
                  className={`badge badge-${String(
                    assignment.placement?.status || ""
                  ).toLowerCase()}`}
                >
                  {assignment.placement?.status || "-"}
                </span>
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
                <strong>Status:</strong>{" "}
                <span className={`badge badge-${String(log.status).toLowerCase()}`}>
                  {log.status}
                </span>
              </p>

              <p>
                <strong>Activities:</strong> {log.activities || "-"}
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
                <strong>Total Score:</strong> {evaluation.total_score}
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

export default AcademicSupervisorDashboard;