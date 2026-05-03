import { useEffect, useState } from "react";

import { getPlacements, patchPlacement } from "../../api/placementsApi";
import {
  getSupervisorAssignments,
  createSupervisorAssignment,
} from "../../api/supervisorAssignmentsApi";
import { getSupervisors } from "../../api/usersApi";

import {
  asArray,
  formatDateTime,
  getStoredUser,
} from "../../utils/dashboardHelpers";

function SupervisorAssignmentsPage() {
  const [placements, setPlacements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [forms, setForms] = useState({});

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loggedInUser = getStoredUser();

  const isAdmin =
    loggedInUser?.role === "ADMINISTRATOR" ||
    loggedInUser?.is_staff ||
    loggedInUser?.is_superuser;

  function loadData() {
    setLoading(true);
    setError("");

    Promise.all([
      getPlacements(),
      getSupervisorAssignments(),
      getSupervisors(),
    ])
      .then(([placementData, assignmentData, supervisorData]) => {
        setPlacements(asArray(placementData));
        setAssignments(asArray(assignmentData));
        setSupervisors(asArray(supervisorData));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load supervisor assignments.");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleFormChange(placementId, field, value) {
    setForms((previous) => ({
      ...previous,
      [placementId]: {
        ...(previous[placementId] || {}),
        [field]: value,
      },
    }));
  }

  function getUserDisplayName(user) {
    if (!user) return "-";

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    return fullName || user.username || "-";
  }

  function getSupervisorDisplayName(supervisor) {
    if (!supervisor) return "Not assigned";

    return (
      supervisor.full_name ||
      supervisor.username ||
      getUserDisplayName(supervisor.user) ||
      "Supervisor"
    );
  }

  function getAcademicSupervisors() {
    return supervisors.filter(
      (supervisor) => supervisor.supervisor_type === "ACADEMIC"
    );
  }

  function getWorkplaceSupervisors() {
    return supervisors.filter(
      (supervisor) => supervisor.supervisor_type === "WORKPLACE"
    );
  }

  function getPlacementAssignments(placementId) {
    return assignments.filter(
      (assignment) => assignment.placement?.id === placementId
    );
  }

  function getActiveAssignmentForRole(placementId, role) {
    return assignments.find(
      (assignment) =>
        assignment.placement?.id === placementId &&
        assignment.assignment_role === role &&
        assignment.is_active
    );
  }

  async function approvePlacement(placement) {
    setMessage("");
    setError("");

    try {
      await patchPlacement(placement.id, {
        status: "APPROVED",
      });

      setMessage("Placement approved successfully.");
      loadData();
    } catch (err) {
      setError(err.message || "Failed to approve placement.");
    }
  }

  async function assignBothSupervisors(placement) {
    setMessage("");
    setError("");

    const form = forms[placement.id] || {};
    const academicSupervisorId = form.academic_supervisor_id;
    const workplaceSupervisorId = form.workplace_supervisor_id;

    const existingAcademic = getActiveAssignmentForRole(
      placement.id,
      "ACADEMIC"
    );

    const existingWorkplace = getActiveAssignmentForRole(
      placement.id,
      "WORKPLACE"
    );

    if (!existingAcademic && !academicSupervisorId) {
      setError("Please select an academic supervisor.");
      return;
    }

    if (!existingWorkplace && !workplaceSupervisorId) {
      setError("Please select a workplace supervisor.");
      return;
    }

    if (existingAcademic && existingWorkplace && placement.status !== "PENDING") {
      setError("Both supervisors are already assigned to this placement.");
      return;
    }

    try {
      if (placement.status === "PENDING") {
        await patchPlacement(placement.id, {
          status: "APPROVED",
        });
      }

      if (!existingAcademic) {
        await createSupervisorAssignment({
          placement_id: placement.id,
          supervisor_id: Number(academicSupervisorId),
          assignment_role: "ACADEMIC",
          is_active: true,
        });
      }

      if (!existingWorkplace) {
        await createSupervisorAssignment({
          placement_id: placement.id,
          supervisor_id: Number(workplaceSupervisorId),
          assignment_role: "WORKPLACE",
          is_active: true,
        });
      }

      setMessage("Placement approved and supervisors assigned successfully.");
      loadData();
    } catch (err) {
      setError(err.message || "Failed to assign supervisors.");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Supervisor Assignments</h1>
        <p>Loading supervisor assignments...</p>
      </div>
    );
  }

  const academicSupervisors = getAcademicSupervisors();
  const workplaceSupervisors = getWorkplaceSupervisors();

  return (
    <div style={{ padding: "30px" }}>
      <h1>Supervisor Assignments</h1>

      <p>
        This page displays academic supervisor and workplace supervisor
        assignments for internship placements.
      </p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {isAdmin && (
        <section style={sectionStyle}>
          <h2>Approve Placements & Assign Supervisors</h2>

          {placements.length === 0 ? (
            <p>No placements found.</p>
          ) : (
            placements.map((placement) => {
              const existingAcademic = getActiveAssignmentForRole(
                placement.id,
                "ACADEMIC"
              );

              const existingWorkplace = getActiveAssignmentForRole(
                placement.id,
                "WORKPLACE"
              );

              const placementAssignments = getPlacementAssignments(placement.id);

              return (
                <div key={placement.id} style={cardStyle}>
                  <h3>
                    {placement.student?.registration_number || "-"} @{" "}
                    {placement.company?.company_name || "-"}
                  </h3>

                  <p>
                    <strong>Student:</strong>{" "}
                    {placement.student?.user?.username || "-"}
                  </p>

                  <p>
                    <strong>Company:</strong>{" "}
                    {placement.company?.company_name || "-"}
                  </p>

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
                    <strong>Internship Period:</strong>{" "}
                    {placement.start_date || "-"} to{" "}
                    {placement.end_date || "-"}
                  </p>

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

                  <h4>Current Assigned Supervisors</h4>

                  <p>
                    <strong>Academic Supervisor:</strong>{" "}
                    {getSupervisorDisplayName(existingAcademic?.supervisor)}
                  </p>

                  <p>
                    <strong>Workplace Supervisor:</strong>{" "}
                    {getSupervisorDisplayName(existingWorkplace?.supervisor)}
                  </p>

                  <p>
                    <strong>Total Assignments:</strong>{" "}
                    {placementAssignments.length}
                  </p>

                  {placement.status === "PENDING" && (
                    <button
                      onClick={() => approvePlacement(placement)}
                      style={buttonStyle}
                    >
                      Approve Placement Only
                    </button>
                  )}

                  <div style={formStyle}>
                    {!existingAcademic && (
                      <label>
                        Academic Supervisor
                        <select
                          value={
                            forms[placement.id]?.academic_supervisor_id || ""
                          }
                          onChange={(event) =>
                            handleFormChange(
                              placement.id,
                              "academic_supervisor_id",
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        >
                          <option value="">Select academic supervisor</option>

                          {academicSupervisors.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {getSupervisorDisplayName(supervisor)} -{" "}
                              {supervisor.organization_name || "-"}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {!existingWorkplace && (
                      <label>
                        Workplace Supervisor
                        <select
                          value={
                            forms[placement.id]?.workplace_supervisor_id || ""
                          }
                          onChange={(event) =>
                            handleFormChange(
                              placement.id,
                              "workplace_supervisor_id",
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        >
                          <option value="">Select workplace supervisor</option>

                          {workplaceSupervisors.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {getSupervisorDisplayName(supervisor)} -{" "}
                              {supervisor.organization_name || "-"}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <button
                      onClick={() => assignBothSupervisors(placement)}
                      style={buttonStyle}
                    >
                      Approve & Assign Missing Supervisors
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      <section style={sectionStyle}>
        <h2>Existing Supervisor Assignments</h2>

        {assignments.length === 0 ? (
          <p>No supervisor assignments found yet.</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} style={cardStyle}>
              <h3>{assignment.assignment_role || "Supervisor Assignment"}</h3>

              <p>
                <strong>Placement:</strong>{" "}
                {assignment.placement?.student?.registration_number || "-"} @{" "}
                {assignment.placement?.company?.company_name || "-"}
              </p>

              <p>
                <strong>Student:</strong>{" "}
                {assignment.placement?.student?.user?.username || "-"}
              </p>

              <p>
                <strong>Supervisor:</strong>{" "}
                {getSupervisorDisplayName(assignment.supervisor)}
              </p>

              <p>
                <strong>Supervisor Email:</strong>{" "}
                {assignment.supervisor?.user?.email || "-"}
              </p>

              <p>
                <strong>Supervisor Type:</strong>{" "}
                {assignment.supervisor?.supervisor_type ||
                  assignment.assignment_role ||
                  "-"}
              </p>

              <p>
                <strong>Organization:</strong>{" "}
                {assignment.supervisor?.organization_name || "-"}
              </p>

              <p>
                <strong>Assigned At:</strong>{" "}
                {assignment.assigned_at
                  ? formatDateTime(assignment.assigned_at)
                  : "-"}
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
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const sectionStyle = {
  marginTop: "25px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "14px",
  backgroundColor: "#fff",
};

const formStyle = {
  display: "grid",
  gap: "12px",
  maxWidth: "600px",
  marginTop: "15px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

const buttonStyle = {
  padding: "10px 14px",
  cursor: "pointer",
  marginTop: "10px",
};

export default SupervisorAssignmentsPage;