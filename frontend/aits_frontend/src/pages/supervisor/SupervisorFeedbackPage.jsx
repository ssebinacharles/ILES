import ApiListPage from "../../components/common/ApiListPage";
import { getFeedback } from "../../api/feedbackApi";

function SupervisorFeedbackPage() {
  return (
    <ApiListPage
      title="Supervisor Feedback"
      description="This page displays feedback given on weekly logs."
      fetchData={getFeedback}
      emptyMessage="No feedback found yet."
      renderItem={(feedback) => (
        <div>
          <h2>{feedback.decision}</h2>

          <p>
            <strong>Comment:</strong> {feedback.comment}
          </p>

          <p>
            <strong>Supervisor:</strong>{" "}
            {feedback.supervisor?.user?.username || "Not provided"}
          </p>

          <p>
            <strong>Score:</strong>{" "}
            {feedback.score !== null && feedback.score !== undefined
              ? `${feedback.score}%`
              : "No score provided"}
          </p>

          <p>
            <strong>Latest:</strong>{" "}
            {feedback.is_latest ? "Yes" : "No"}
          </p>
        </div>
      )}
    />
  );
}

export default SupervisorFeedbackPage;