import ApiListPage from "../../components/common/ApiListPage";
import { getEvaluations } from "../../api/evaluationsApi";

function SupervisorEvaluationsPage() {
  return (
    <ApiListPage
      title="Evaluations"
      description="This page displays internship evaluations."
      fetchData={getEvaluations}
      emptyMessage="No evaluations found yet."
      renderItem={(evaluation) => (
        <div>
          <h2>{evaluation.evaluation_type}</h2>

          <p>
            <strong>Status:</strong> {evaluation.status}
          </p>

          <p>
            <strong>Total Score:</strong> {evaluation.total_score}
          </p>

          <p>
            <strong>Weighted Score:</strong>{" "}
            {evaluation.weighted_score}
          </p>

          <p>
            <strong>Remarks:</strong>{" "}
            {evaluation.remarks || "No remarks"}
          </p>

          <p>
            <strong>Submitted At:</strong>{" "}
            {evaluation.submitted_at || "Not submitted yet"}
          </p>
        </div>
      )}
    />
  );
}

export default SupervisorEvaluationsPage;