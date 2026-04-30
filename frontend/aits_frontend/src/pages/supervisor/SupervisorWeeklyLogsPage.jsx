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

    try {
      await createFeedback({
        weekly_log_id: logId,
        decision: form.decision || "COMMENT",
        comment: form.comment || "",
        score: form.score || null,
        is_latest: true,
      });

      setMessage("Feedback submitted.");
      loadLogs();
    } catch (err) {
      setError(err.message || "Failed to submit feedback.");
    }
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
            <p><strong>Submitted:</strong> {formatDateTime(log.submitted_at)}</p>

            <h3>Student Activities</h3>
            <p><strong>Monday:</strong> {log.monday_activities || "-"}</p>
            <p><strong>Tuesday:</strong> {log.tuesday_activities || "-"}</p>
            <p><strong>Wednesday:</strong> {log.wednesday_activities || "-"}</p>
            <p><strong>Thursday:</strong> {log.thursday_activities || "-"}</p>
            <p><strong>Friday:</strong> {log.friday_activities || "-"}</p>
            <p><strong>Challenges:</strong> {log.challenges || "-"}</p>
            <p><strong>Lessons Learned:</strong> {log.lessons_learned || "-"}</p>

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