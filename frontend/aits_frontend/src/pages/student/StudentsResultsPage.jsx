import ApiListPage from "../../components/common/ApiListPage";
import { getMyFinalResult } from "../../api/finalResultsApi";
import { formatDateTime } from "../../utils/dashboardHelpers";

function StudentsResultsPage() {
  function displayScore(value) {
    if (value === null || value === undefined || value === "") {
      return "Not available";
    }

    return `${value}%`;
  }

  return (
    <ApiListPage
      title="My Results"
      description="This page displays your internship result based on your assessed weekly logs, supervisor evaluation, workplace assessment, and final mark."
      fetchData={getMyFinalResult}
      emptyMessage="No result found yet. Your result will appear after your submitted weekly logs are assessed and published."
      renderItem={(result) => (
        <div style={resultBoxStyle}>
          <h2>Final Mark: {displayScore(result.final_mark)}</h2>

          <p>
            <strong>Assessed Weekly Logs:</strong>{" "}
            {result.assessed_weekly_logs_count ?? 0}
          </p>

          <p>
            <strong>Average Weekly Logs Score:</strong>{" "}
            {displayScore(result.weekly_logs_score)}
          </p>

          <p>
            <strong>Supervisor Evaluation Score:</strong>{" "}
            {displayScore(result.supervisor_evaluation_score)}
          </p>

          <p>
            <strong>Workplace Assessment Score:</strong>{" "}
            {displayScore(result.workplace_assessment_score)}
          </p>

          <p>
            <strong>Final Report Score:</strong>{" "}
            {displayScore(result.final_report_score)}
          </p>

          <p>
            <strong>Published At:</strong>{" "}
            {result.published_at
              ? formatDateTime(result.published_at)
              : "Not published yet"}
          </p>

          <h3>Placement Details</h3>

          <p>
            <strong>Company:</strong>{" "}
            {result.placement?.company?.company_name || "-"}
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {result.placement?.company?.location || "-"}
          </p>

          <p>
            <strong>Internship Period:</strong>{" "}
            {result.placement?.start_date || "-"} to{" "}
            {result.placement?.end_date || "-"}
          </p>

          <p>
            <strong>Placement Status:</strong>{" "}
            {result.placement?.status || "-"}
          </p>
        </div>
      )}
    />
  );
}

const resultBoxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "14px",
  background: "#fff",
};

export default StudentsResultsPage;