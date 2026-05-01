import ApiListPage from "../../components/common/ApiListPage";
import PerformanceTrendChart from "../../components/common/PerformanceTrendChart";
import { getMyWeeklyLogEvaluations } from "../../api/weeklyLogsApi";

function StudentsEvaluationsPage() {
  return (
    <ApiListPage
      title="My Evaluations"
      description="This page shows your submitted weekly logs that have been assessed by both the academic supervisor and workplace supervisor."
      fetchData={getMyWeeklyLogEvaluations}
      emptyMessage="No assessed weekly logs found yet."
      renderItem={(evaluation) => (
        <div>
          <h2>Week {evaluation.week_number}</h2>

          <p>
            <strong>Title:</strong> {evaluation.title}
          </p>

          <p>
            <strong>Status:</strong> {evaluation.status}
          </p>

          <p>
            <strong>Academic Supervisor Score:</strong>{" "}
            {evaluation.academic_score !== null
              ? `${evaluation.academic_score}%`
              : "Not marked yet"}
          </p>

          <p>
            <strong>Workplace Supervisor Score:</strong>{" "}
            {evaluation.workplace_score !== null
              ? `${evaluation.workplace_score}%`
              : "Not marked yet"}
          </p>

          <p>
            <strong>Final Weekly Log Mark:</strong>{" "}
            {evaluation.average_score !== null
              ? `${evaluation.average_score}%`
              : "Pending"}
          </p>

          <p>
            <strong>Fully Assessed:</strong>{" "}
            {evaluation.is_fully_assessed ? "Yes" : "No"}
          </p>

          {evaluation.company && (
            <p>
              <strong>Company:</strong> {evaluation.company.company_name}
            </p>
          )}

          {evaluation.submitted_at && (
            <p>
              <strong>Submitted At:</strong>{" "}
              {new Date(evaluation.submitted_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    />
  );
}

export default StudentsEvaluationsPage;