import { useEffect, useState } from "react";

import { getPlacements } from "../../api/placementsApi";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { getEvaluations } from "../../api/evaluationsApi";
import { getFinalResults } from "../../api/finalResultsApi";

import { asArray } from "../../utils/dashboardHelpers";

function AdminAssessmentsPage() {
  const [data, setData] = useState({
    placements: [],
    logs: [],
    evaluations: [],
    results: [],
  });

  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getPlacements(),
      getWeeklyLogs(),
      getEvaluations(),
      getFinalResults(),
    ])
      .then(([placements, logs, evaluations, results]) => {
        setData({
          placements: asArray(placements),
          logs: asArray(logs),
          evaluations: asArray(evaluations),
          results: asArray(results),
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h1>Student Assessments</h1>
      <p>
        View assessments received from assigned supervisors and final results for each student.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data.placements.length === 0 ? (
        <p>No placements found.</p>
      ) : (
        data.placements.map((placement) => {
          const placementLogs = data.logs.filter(
            (log) => log.placement?.id === placement.id
          );

          const placementEvaluations = data.evaluations.filter(
            (evaluation) => evaluation.placement?.id === placement.id
          );

          const finalResult = data.results.find(
            (result) => result.placement?.id === placement.id
          );

          return (
            <div key={placement.id} style={boxStyle}>
              <h2>
                {placement.student?.registration_number} -{" "}
                {placement.company?.company_name}
              </h2>

              <p><strong>Student:</strong> {placement.student?.user?.username}</p>
              <p><strong>Placement Status:</strong> {placement.status}</p>
              <p><strong>Total Weekly Logs:</strong> {placementLogs.length}</p>
              <p><strong>Evaluations:</strong> {placementEvaluations.length}</p>
              <p><strong>Final Mark:</strong> {finalResult?.final_mark || "Not published"}</p>

              <h3>Supervisor Evaluations</h3>

              {placementEvaluations.length === 0 ? (
                <p>No evaluations submitted yet.</p>
              ) : (
                placementEvaluations.map((evaluation) => (
                  <div key={evaluation.id} style={innerBoxStyle}>
                    <strong>{evaluation.evaluation_type}</strong>
                    <p>Evaluator: {evaluation.evaluator?.user?.username}</p>
                    <p>Total Score: {evaluation.total_score}</p>
                    <p>Weighted Score: {evaluation.weighted_score}</p>
                    <p>Status: {evaluation.status}</p>
                  </div>
                ))
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const boxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "14px",
};

const innerBoxStyle = {
  border: "1px solid #eee",
  borderRadius: "8px",
  padding: "10px",
  marginBottom: "10px",
  background: "#fafafa",
};

export default AdminAssessmentsPage;