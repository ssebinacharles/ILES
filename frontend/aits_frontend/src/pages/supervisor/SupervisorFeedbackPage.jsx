import ApiListPage from "../../components/common/ApiListPage";

import { getFeedback } from "../../api/feedbackApi";
import { displayScore, formatDateTime } from "../../utils/dashboardHelpers";

function SupervisorFeedbackPage() {
  return (
    <ApiListPage
      title="Supervisor Feedback"
      description="This page displays feedback submitted on assigned students’ weekly logs."
      fetchData={getFeedback}
      emptyMessage="No feedback found yet."
      renderItem={(feedback) => (
        <div>
          <h2>{feedback.decision || "Feedback"}</h2>

          <p>
            <strong>Weekly Log:</strong>{" "}
            {feedback.weekly_log
              ? `Week ${feedback.weekly_log.week_number} - ${feedback.weekly_log.title}`
              : "-"}
          </p>

          <p>
            <strong>Weekly Log Submitted At:</strong>{" "}
            {feedback.weekly_log?.submitted_at
              ? formatDateTime(feedback.weekly_log.submitted_at)
              : "Not submitted yet"}
          </p>

          <p>
            <strong>Student:</strong>{" "}
            {feedback.weekly_log?.student_name || "-"}{" "}
            {feedback.weekly_log?.registration_number
              ? `(${feedback.weekly_log.registration_number})`
              : ""}
          </p>

          <p>
            <strong>Company:</strong>{" "}
            {feedback.weekly_log?.company_name || "-"}
          </p>

          <p>
            <strong>Supervisor:</strong>{" "}
            {feedback.supervisor?.user?.username || "Not provided"}
          </p>

          <p>
            <strong>Supervisor Type:</strong>{" "}
            {feedback.supervisor?.supervisor_type || "-"}
          </p>

          <p>
            <strong>Feedback Sent At:</strong>{" "}
            {feedback.created_at ? formatDateTime(feedback.created_at) : "-"}
          </p>

          <p>
            <strong>Decision:</strong> {feedback.decision || "-"}
          </p>

          <p>
            <strong>Score:</strong> {displayScore(feedback.score, "No score provided")}
          </p>

          <p>
            <strong>Comment:</strong> {feedback.comment || "-"}
          </p>

          <p>
            <strong>Latest:</strong> {feedback.is_latest ? "Yes" : "No"}
          </p>
        </div>
      )}
    />
  );
}

export default SupervisorFeedbackPage;