import AcademicSupervisorDashboard from "./AcademicSupervisorDashboard";
import WorkplaceSupervisorDashboard from "./WorkplaceSupervisorDashboard";
import { getStoredUser } from "../../utils/dashboardHelpers";

function SupervisorDashboard() {
  const user = getStoredUser();
  const supervisorType = user?.profile?.supervisor_type;

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
    </div>
  );
}

export default SupervisorDashboard;