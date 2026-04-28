import ApiListPage from "../../components/common/ApiListPage";
import { getFinalResults } from "../../api/finalResultsApi";

function StudentsResultsPage() {
  return (
    <ApiListPage
      title="Final Results"
      description="This page displays internship final results."
      fetchData={getFinalResults}
      emptyMessage="No final results found yet."
      renderItem={(result) => (
        <div>
          <h2>Final Mark: {result.final_mark}</h2>

          <p>
            <strong>Weekly Logs Score:</strong>{" "}
            {result.weekly_logs_score}
          </p>

          <p>
            <strong>Supervisor Evaluation Score:</strong>{" "}
            {result.supervisor_evaluation_score}
          </p>

          <p>
            <strong>Final Report Score:</strong>{" "}
            {result.final_report_score}
          </p>

          <p>
            <strong>Workplace Assessment Score:</strong>{" "}
            {result.workplace_assessment_score}
          </p>

          <p>
            <strong>Published At:</strong>{" "}
            {result.published_at || "Not published yet"}
          </p>
        </div>
      )}
    />
  );
}

export default StudentsResultsPage;