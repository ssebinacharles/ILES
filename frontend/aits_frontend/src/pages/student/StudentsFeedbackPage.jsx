import { useEffect, useState } from "react";

import { getFeedback } from "../../api/feedbackApi";
import { formatDateTime } from "../../utils/dashboardHelpers";

function StudentsFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadFeedback() {
    setLoading(true);
    setError("");

    getFeedback()
      .then((data) => {
        setFeedbackList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load feedback.");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Supervisor Feedback</h1>
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Supervisor Feedback</h1>
      <p>This page displays feedback given on your weekly logs.</p>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {feedbackList.length === 0 ? (
        <p>No feedback found yet.</p>
      ) : (
        feedbackList.map((feedback) => (
          <div key={feedback.id} style={boxStyle}>
            <h2>{feedback.decision}</h2>

            <p>
              <strong>Weekly Log:</strong>{" "}
              {feedback.weekly_log
                ? `Week ${feedback.weekly_log.week_number} - ${feedback.weekly_log.title}`
                : "Not shown"}
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
              {feedback.supervisor?.user?.username || "-"}
            </p>

            <p>
              <strong>Feedback Sent At:</strong>{" "}
              {feedback.created_at
                ? formatDateTime(feedback.created_at)
                : "-"}
            </p>

            <p>
              <strong>Decision:</strong> {feedback.decision || "-"}
            </p>

            <p>
              <strong>Score:</strong>{" "}
              {feedback.score !== null && feedback.score !== undefined
                ? `${feedback.score}%`
                : "-"}
            </p>

            <p>
              <strong>Comment:</strong> {feedback.comment || "-"}
            </p>

            <p>
              <strong>Latest:</strong> {feedback.is_latest ? "Yes" : "No"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

const boxStyle = {
  border: "1px solid #ddd",
  padding: "20px",
  marginBottom: "20px",
  borderRadius: "8px",
  background: "#fff",
};

export default StudentsFeedbackPage;