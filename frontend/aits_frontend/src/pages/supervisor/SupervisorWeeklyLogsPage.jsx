import { useEffect, useState } from "react";

import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { createFeedback } from "../../api/feedbackApi";

import { asArray, formatDateTime } from "../../utils/dashboardHelpers";

function SupervisorWeeklyLogsPage() {
  const [logs, setLogs] = useState([]);
  const [forms, setForms] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function loadLogs() {
    getWeeklyLogs()
      .then((data) => setLogs(asArray(data)))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function handleChange(logId, field, value) {
    setForms((previous) => ({
      ...previous,
      [logId]: {
        ...(previous[logId] || {}),
        [field]: value,
      },
    }));
  }
async function submitFeedback(logId) {
  setMessage("");
  setError("");

  const form = forms[logId] || {};
  const scoreValue = form.score;

  if (scoreValue === undefined || scoreValue === null || scoreValue === "") {
    setError("Please enter a score before submitting feedback.");
    return;
  }

  const numericScore = Number(scoreValue);

  if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
    setError("Score must be a number between 0 and 100.");
    return;
  }

  if (!form.comment || form.comment.trim() === "") {
    setError("Please enter a comment before submitting feedback.");
    return;
  }

  try {
    await createFeedback({
      weekly_log_id: logId,
      decision: form.decision || "COMMENT",
      comment: form.comment.trim(),
      score: numericScore,
      is_latest: true,
    });

    setMessage("Feedback and score submitted.");
    loadLogs();
  } catch (err) {
    setError(err.message || "Failed to submit feedback.");
  }
}

function getSubmissionTime(log) {
  if (log.submitted_at) {
    return formatDateTime(log.submitted_at);
  }

  if (log.status !== "DRAFT" && log.updated_at) {
    return formatDateTime(log.updated_at);
  }

  return "Not submitted yet";
}

  return (
    <div style={{ padding: "30px" }}>
      <h1>Student Weekly Logs</h1>
      <p>Review assigned students’ logs. Student entries are read-only.</p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {logs.length === 0 ? (
        <p>No weekly logs found.</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} style={boxStyle}>
            <h2>Week {log.week_number}: {log.title}</h2>

            <p><strong>Student:</strong> {log.placement?.student?.user?.username}</p>
            <p><strong>Registration Number:</strong> {log.placement?.student?.registration_number}</p>
            <p><strong>Company:</strong> {log.placement?.company?.company_name}</p>
            <p><strong>Status:</strong> {log.status}</p>
            <p><strong>Submitted At:</strong> {getSubmissionTime(log)}</p>

            <h3>Weekly Log Evaluation Summary</h3>

            <p>
              <strong>Academic Supervisor Score:</strong>{" "}
              {log.academic_score !== null && log.academic_score !== undefined
                ? `${log.academic_score}%`
                : "Not marked yet"}
            </p>

            <p>
              <strong>Workplace Supervisor Score:</strong>{" "}
              {log.workplace_score !== null && log.workplace_score !== undefined
                ? `${log.workplace_score}%`
                : "Not marked yet"}
            </p>

            <p>
              <strong>Final Weekly Log Mark:</strong>{" "}
              {log.average_score !== null && log.average_score !== undefined
                ? `${log.average_score}%`
                : "Pending both supervisor scores"}
            </p>

            <p>
              <strong>Fully Assessed:</strong>{" "}
              {log.is_fully_assessed ? "Yes" : "No"}
            </p>

            <h3>Student Activities</h3>
            <p><strong>Monday:</strong> {log.monday_activities || "-"}</p>
            <p><strong>Tuesday:</strong> {log.tuesday_activities || "-"}</p>
            <p><strong>Wednesday:</strong> {log.wednesday_activities || "-"}</p>
            <p><strong>Thursday:</strong> {log.thursday_activities || "-"}</p>
            <p><strong>Friday:</strong> {log.friday_activities || "-"}</p>
            <p><strong>Challenges:</strong> {log.challenges || "-"}</p>
            <p><strong>Lessons Learned:</strong> {log.lessons_learned || "-"}</p>

            <h3>Existing Feedback</h3>

            {asArray(log.feedback_entries).length === 0 ? (
              <p>No feedback submitted yet.</p>
            ) : (
              asArray(log.feedback_entries).map((feedback) => (
                <div key={feedback.id} style={boxStyle}>
                  <p><strong>Supervisor:</strong> {feedback.supervisor?.user?.username || "-"}</p>
                  <p><strong>Feedback Sent At:</strong> {formatDateTime(feedback.created_at)}</p>
                  <p><strong>Decision:</strong> {feedback.decision}</p>
                  <p>
                    <strong>Score:</strong>{" "}
                    {feedback.score !== null && feedback.score !== undefined
                      ? `${feedback.score}%`
                      : "-"}
                  </p>
                  <p><strong>Comment:</strong> {feedback.comment || "-"}</p>
                </div>
              ))
            )}
          
        
      
            <h3>Give Feedback and Score</h3>

            <div style={formStyle}>
              <label>
                Decision
                <select
                  value={forms[log.id]?.decision || "COMMENT"}
                  onChange={(event) =>
                    handleChange(log.id, "decision", event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="COMMENT">Comment</option>
                  <option value="APPROVED">Approve</option>
                  <option value="REJECTED">Reject</option>
                </select>
              </label>

              <label>
                Score
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={forms[log.id]?.score || ""}
                  onChange={(event) =>
                    handleChange(log.id, "score", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label>
                Comment
                <textarea
                  value={forms[log.id]?.comment || ""}
                  onChange={(event) =>
                    handleChange(log.id, "comment", event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <button onClick={() => submitFeedback(log.id)}>
                Submit Feedback
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const boxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "14px",
};

const formStyle = {
  display: "grid",
  gap: "10px",
  maxWidth: "500px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

export default SupervisorWeeklyLogsPage;