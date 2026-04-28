import ApiListPage from "../../components/common/ApiListPage";
import { getSupervisorAssignments } from "../../api/supervisorAssignmentsApi";

function SupervisorAssignmentsPage() {
  return (
    <ApiListPage
      title="Supervisor Assignments"
      description="This page displays assigned supervisors for internship placements."
      fetchData={getSupervisorAssignments}
      emptyMessage="No supervisor assignments found yet."
      renderItem={(assignment) => (
        <div>
          <h2>{assignment.assignment_role}</h2>

          <p>
            <strong>Supervisor:</strong>{" "}
            {assignment.supervisor?.user?.username || "Not provided"}
          </p>

          <p>
            <strong>Type:</strong> {assignment.assignment_role}
          </p>

          <p>
            <strong>Assigned At:</strong> {assignment.assigned_at}
          </p>

          <p>
            <strong>Active:</strong>{" "}
            {assignment.is_active ? "Yes" : "No"}
          </p>
        </div>
      )}
    />
  );
}

export default SupervisorAssignmentsPage;