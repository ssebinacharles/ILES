import { useEffect, useState } from "react";

import { getCompanies } from "../api/companiesApi";
import { getPlacements } from "../api/placementsApi";
import { getWeeklyLogs } from "../api/weeklyLogsApi";
import { getSupervisorAssignments } from "../api/supervisorAssignmentsApi";
import { getFeedback } from "../api/feedbackApi";
import { getEvaluations } from "../api/evaluationsApi";
import { getFinalResults } from "../api/finalResultsApi";
import {
  getUsers,
  getStudents,
  getSupervisors,
  getAdministrators,
} from "../api/usersApi";

function ApiSection({ title, status, data, error }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "16px",
      }}
    >
      <h2>{title}</h2>

      {status === "loading" && <p>Loading...</p>}

      {status === "success" && (
        <>
          <p style={{ color: "green" }}>Connected successfully.</p>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "12px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      )}

      {status === "error" && (
        <>
          <p style={{ color: "red" }}>Failed to connect.</p>
          <p>{error}</p>
        </>
      )}
    </div>
  );
}

function ApiConnectionTest() {
  const [results, setResults] = useState({
    companies: { status: "loading", data: null, error: "" },
    placements: { status: "loading", data: null, error: "" },
    weeklyLogs: { status: "loading", data: null, error: "" },
    supervisorAssignments: { status: "loading", data: null, error: "" },
    feedback: { status: "loading", data: null, error: "" },
    evaluations: { status: "loading", data: null, error: "" },
    finalResults: { status: "loading", data: null, error: "" },
    users: { status: "loading", data: null, error: "" },
    students: { status: "loading", data: null, error: "" },
    supervisors: { status: "loading", data: null, error: "" },
    administrators: { status: "loading", data: null, error: "" },
  });

  function updateResult(key, newValue) {
    setResults((previous) => ({
      ...previous,
      [key]: {
        ...previous[key],
        ...newValue,
      },
    }));
  }

  async function testApi(key, apiFunction) {
    try {
      const data = await apiFunction();

      updateResult(key, {
        status: "success",
        data,
        error: "",
      });
    } catch (error) {
      updateResult(key, {
        status: "error",
        data: null,
        error: error.message,
      });
    }
  }

  useEffect(() => {
    testApi("companies", getCompanies);
    testApi("placements", getPlacements);
    testApi("weeklyLogs", getWeeklyLogs);
    testApi("supervisorAssignments", getSupervisorAssignments);
    testApi("feedback", getFeedback);
    testApi("evaluations", getEvaluations);
    testApi("finalResults", getFinalResults);
    testApi("users", getUsers);
    testApi("students", getStudents);
    testApi("supervisors", getSupervisors);
    testApi("administrators", getAdministrators);
  }, []);

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h1>ILES API Connection Test</h1>

      <p>
        This page checks whether the React frontend can connect to each Django
        REST API endpoint.
      </p>

      <ApiSection
        title="Companies API"
        status={results.companies.status}
        data={results.companies.data}
        error={results.companies.error}
      />

      <ApiSection
        title="Placements API"
        status={results.placements.status}
        data={results.placements.data}
        error={results.placements.error}
      />

      <ApiSection
        title="Weekly Logs API"
        status={results.weeklyLogs.status}
        data={results.weeklyLogs.data}
        error={results.weeklyLogs.error}
      />

      <ApiSection
        title="Supervisor Assignments API"
        status={results.supervisorAssignments.status}
        data={results.supervisorAssignments.data}
        error={results.supervisorAssignments.error}
      />

      <ApiSection
        title="Feedback API"
        status={results.feedback.status}
        data={results.feedback.data}
        error={results.feedback.error}
      />

      <ApiSection
        title="Evaluations API"
        status={results.evaluations.status}
        data={results.evaluations.data}
        error={results.evaluations.error}
      />

      <ApiSection
        title="Final Results API"
        status={results.finalResults.status}
        data={results.finalResults.data}
        error={results.finalResults.error}
      />

      <ApiSection
        title="Users API"
        status={results.users.status}
        data={results.users.data}
        error={results.users.error}
      />

      <ApiSection
        title="Students API"
        status={results.students.status}
        data={results.students.data}
        error={results.students.error}
      />

      <ApiSection
        title="Supervisors API"
        status={results.supervisors.status}
        data={results.supervisors.data}
        error={results.supervisors.error}
      />

      <ApiSection
        title="Administrators API"
        status={results.administrators.status}
        data={results.administrators.data}
        error={results.administrators.error}
      />
    </div>
  );
}

export default ApiConnectionTest;