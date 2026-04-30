import React, { useEffect, useState } from "react";
import { getFeedback } from "../../api/feedbackApi";

function StudentsFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFeedback()
      .then((data) => {
        setFeedbackList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load feedback.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading feedback...</p>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Supervisor Feedback</h1>
      <p>This page displays feedback given on weekly logs.</p>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {feedbackList.length === 0 ? (
        <p>No feedback found yet.</p>
      ) : (
        feedbackList.map((feedback) => (
          <div
            key={feedback.id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "8px",
            }}
          >
            <h2>{feedback.decision}</h2>

            <p>
              <strong>Weekly Log:</strong>{" "}
              {feedback.weekly_log
                ? `Week ${feedback.weekly_log.week_number} - ${feedback.weekly_log.title}`
                : "Not shown"}
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
              <strong>Comment:</strong> {feedback.comment || "-"}
            </p>

            <p>
              <strong>Score:</strong> {feedback.score ?? "-"}
            </p>

            <p>
              <strong>Supervisor:</strong>{" "}
              {feedback.supervisor?.user?.username || "-"}
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

export default StudentsFeedbackPage;