import ApiListPage from "../../components/common/ApiListPage";
import { getMyFinalResult } from "../../api/finalResultsApi";

function StudentsResultsPage() {
  return (
    <ApiListPage
      title="My Results"
      description="This page displays your internship result based on the average mark of your assessed weekly logs."
      fetchData={getMyFinalResult}
      emptyMessage="No result found yet. Your result will appear after your submitted weekly logs are assessed by both supervisors."
      renderItem={(result) => (
        <div>
          <h2>Final Mark: {result.final_mark}%</h2>

          <p>
            <strong>Assessed Weekly Logs:</strong>{" "}
            {result.assessed_weekly_logs_count ?? 0}
          </p>

          <p>
            <strong>Average Weekly Logs Score:</strong>{" "}
            {result.weekly_logs_score}%
          </p>

         
          <p>
            <strong>Published At:</strong>{" "}
            {result.published_at
              ? new Date(result.published_at).toLocaleString()
              : "Not published yet"}
          </p>

          {result.placement?.company && (
            <p>
              <strong>Company:</strong>{" "}
              {result.placement.company.company_name}
            </p>
          )}
        </div>
      )}
    />
  );
}

export default StudentsResultsPage;