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
    return <Page><h1>Academic Supervisor Dashboard</h1><p>Loading dashboard...</p></Page>;
  }

  if (error) {
    return <Page><h1>Academic Supervisor Dashboard</h1><p style={{ color: "red" }}>Error: {error}</p></Page>;
  }

  const logStatusCounts = countByStatus(dashboard.weeklyLogs);

  return (
    <Page>
      <h1>Academic Supervisor Dashboard</h1>
      <p>Monitor assigned students, review weekly logs, give feedback and submit academic evaluations.</p>

      <Grid>
        <Card title="Assigned Students" value={dashboard.students.length} />
        <Card title="Weekly Logs" value={dashboard.weeklyLogs.length} />
        <Card title="Submitted Logs" value={logStatusCounts.SUBMITTED || 0} />
        <Card title="Approved Logs" value={logStatusCounts.APPROVED || 0} />
        <Card title="Rejected Logs" value={logStatusCounts.REJECTED || 0} />
        <Card title="Feedback Given" value={dashboard.feedback.length} />
        <Card title="Academic Evaluations" value={dashboard.evaluations.length} />
      </Grid>

      <Section title="Assigned Students">
        {dashboard.students.length === 0 ? (
          <p>No assigned students found.</p>
        ) : (
          dashboard.assignments.map((assignment) => (
            <ListItem key={assignment.id}>
              <strong>{assignment.placement?.student?.registration_number}</strong>
              <p>Student: {assignment.placement?.student?.user?.username}</p>
              <p>Company: {assignment.placement?.company?.company_name}</p>
              <p>Placement Status: {assignment.placement?.status}</p>
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
              <strong>Week {log.week_number}: {log.title}</strong>
              <p>Student: {log.placement?.student?.registration_number}</p>
              <p>Status: {log.status}</p>
              <p>Activities: {log.activities}</p>
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
              <strong>{evaluation.evaluation_type}</strong>
              <p>Student: {evaluation.placement?.student?.registration_number}</p>
              <p>Status: {evaluation.status}</p>
              <p>Total Score: {evaluation.total_score}</p>
              <p>Weighted Score: {evaluation.weighted_score}</p>
              <p>Remarks: {evaluation.remarks || "-"}</p>
            </ListItem>
          ))
        )}
      </Section>
    </Page>
  );
}

function Page({ children }) {
  return <div style={{ padding: "30px" }}>{children}</div>;
}

function Grid({ children }) {
  return <div style={gridStyle}>{children}</div>;
}

function Card({ title, value }) {
  return (
    <div style={cardStyle}>
      <h2>{value}</h2>
      <p>{title}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: "30px" }}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ListItem({ children }) {
  return <div style={listItemStyle}>{children}</div>;
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

const listItemStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "15px",
  marginBottom: "12px",
  background: "#fff",
};

export default AcademicSupervisorDashboard;