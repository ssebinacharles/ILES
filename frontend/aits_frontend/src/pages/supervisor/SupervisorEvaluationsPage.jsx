import ApiListPage from "../../components/common/ApiListPage";
import { getEvaluations } from "../../api/evaluationsApi";
import { displayScore, formatDateTime } from "../../utils/dashboardHelpers";
function SupervisorEvaluationsPage() {
  return (
    <ApiListPage
      title="Evaluations"
      description="This page displays internship evaluation records for assigned placements."
      fetchData={getEvaluations}
      emptyMessage="No evaluations found yet."
      renderItem={(evaluation) => (
        <div>
          <h2>{evaluation.evaluation_type || "Evaluation"}</h2>
          <p>
            <strong>Student:</strong>{" "}
            {evaluation.placement?.student?.registration_number || "-"}
          </p>
          <p>
            <strong>Student Name:</strong>{" "}
            {evaluation.placement?.student?.user?.username || "-"}
          </p>

          <p>
            <strong>Company:</strong>{" "}
            {evaluation.placement?.company?.company_name || "-"}
          </p>

          <p>
            <strong>Evaluator:</strong>{" "}
            {evaluation.evaluator?.user?.username || "-"}
          </p>

          <p>
            <strong>Evaluator Type:</strong>{" "}
            {evaluation.evaluator?.supervisor_type || "-"}
          </p>
          <p>
            <strong>Status:</strong> {evaluation.status || "-"}
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
            <strong>Submitted At:</strong>{" "}
            {evaluation.submitted_at
              ? formatDateTime(evaluation.submitted_at)
              : "Not submitted yet"}
          </p>
          <p>
            <strong>Remarks:</strong>{" "}
            {evaluation.remarks || "No remarks"}
          </p>
        </div>
      )}
    />
  );
}
export default SupervisorEvaluationsPage;
