import ApiListPage from "../../components/common/ApiListPage";
import PerformanceTrendChart from "../../components/common/PerformanceTrendChart";

import { getMyWeeklyLogEvaluations } from "../../api/weeklyLogsApi";
import { displayScore, formatDateTime } from "../../utils/dashboardHelpers";

function StudentsEvaluationsPage() {
  return (
    <ApiListPage
      title="My Evaluations"
      description="This page shows your submitted weekly logs that have been assessed by both the academic supervisor and workplace supervisor."
      fetchData={getMyWeeklyLogEvaluations}
      emptyMessage="No assessed weekly logs found yet. Your evaluations will appear after both supervisors score your submitted weekly logs."
      renderTop={(evaluations) => (
        <PerformanceTrendChart
          evaluations={evaluations}
          title="My Weekly Log Performance Trend"
        />
      )}
      renderItem={(evaluation) => (
        <div>
          <h2>Week {evaluation.week_number}</h2>

          <p>
            <strong>Title:</strong> {evaluation.title || "-"}
          </p>

          <p>
            <strong>Status:</strong> {evaluation.status || "-"}
          </p>

          <p>
            <strong>Submitted At:</strong>{" "}
            {evaluation.submitted_at
              ? formatDateTime(evaluation.submitted_at)
              : "Not submitted yet"}
          </p>

          <p>
            <strong>Academic Supervisor Score:</strong>{" "}
            {displayScore(evaluation.academic_score, "Not marked yet")}
          </p>

          <p>
            <strong>Workplace Supervisor Score:</strong>{" "}
            {displayScore(evaluation.workplace_score, "Not marked yet")}
          </p>

          <p>
            <strong>Final Weekly Log Mark:</strong>{" "}
            {displayScore(evaluation.average_score, "Pending")}
          </p>

          <p>
            <strong>Fully Assessed:</strong>{" "}
            {evaluation.is_fully_assessed ? "Yes" : "No"}
          </p>

          <p>
            <strong>Company:</strong>{" "}
            {evaluation.company?.company_name || "-"}
          </p>
        </div>
      )}
    />
  );
}

export default StudentsEvaluationsPage;