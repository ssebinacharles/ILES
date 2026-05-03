import AcademicSupervisorDashboard from "./AcademicSupervisorDashboard";
import WorkplaceSupervisorDashboard from "./WorkplaceSupervisorDashboard";

import { getStoredUser } from "../../utils/dashboardHelpers";

function SupervisorDashboard() {
  const user = getStoredUser();

  const supervisorType =
    user?.profile?.supervisor_type ||
    user?.supervisor_type ||
    user?.profile?.type ||
    "";

  if (supervisorType === "ACADEMIC") {
    return <AcademicSupervisorDashboard />;
  }

  if (supervisorType === "WORKPLACE") {
    return <WorkplaceSupervisorDashboard />;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Supervisor Dashboard</h1>

      <p>
        Supervisor type was not found. Please confirm that this user has a
        supervisor profile in Django admin.
      </p>

      <div style={boxStyle}>
        <h2>Logged-in User Details</h2>

        <p>
          <strong>Username:</strong> {user?.username || "-"}
        </p>

        <p>
          <strong>Role:</strong> {user?.role || "-"}
        </p>

        <p>
          <strong>Detected Supervisor Type:</strong>{" "}
          {supervisorType || "Not found"}
        </p>
      </div>

      <p style={{ color: "gray" }}>
        Expected supervisor type should be either ACADEMIC or WORKPLACE.
      </p>
    </div>
  );
}

const boxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "16px",
  background: "#fff",
};

export default SupervisorDashboard;