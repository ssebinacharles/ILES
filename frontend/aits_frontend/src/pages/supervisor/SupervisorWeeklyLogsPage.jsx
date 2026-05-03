import { useEffect, useState } from "react";

import { getWeeklyLogs } from "../../api/weeklyLogsApi";
import { createFeedback } from "../../api/feedbackApi";

import {
  asArray,
  displayScore,
  formatDateTime,
  getStoredUser,
  getSubmissionTime,
  getUserProfileId,
} from "../../utils/dashboardHelpers";

function SupervisorWeeklyLogsPage() {
  const [user] = useState(() => getStoredUser());

  const [logs, setLogs] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function loadLogs() {
    setLoading(true);
    setError("");

    getWeeklyLogs()
      .then((data) => {
        setLogs(asArray(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load weekly logs.");
        setLoading(false);
      });
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

  function getMyFeedback(log) {
    const profileId = getUserProfileId(user);

    return asArray(log.feedback_entries).find((feedback) => {
      const supervisor = feedback.supervisor;

      return (
        supervisor?.id === profileId ||
        supervisor?.user?.id === user?.id ||
        supervisor?.user?.username === user?.username ||
        supervisor?.user?.email === user?.email
      );
    });
  }

  async function submitFeedback(logId) {
    setMessage("");
    setError("");

    const form = forms[logId] || {};
    const log = logs.find((item) => item.id === logId);

    if (!log) {
      setError("Weekly log not found.");
      return;
    }

    if (log.status === "DRAFT") {
      setError("You cannot submit feedback on a draft weekly log.");
      return;
    }

    const existingFeedback = getMyFeedback(log);

    if (existingFeedback) {
      setError("You have already submitted feedback for this weekly log.");
      return;
    }

    if (!form.comment || form.comment.trim() === "") {
      setError("Please enter a comment before submitting feedback.");
      return;
    }

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

    try {
      await createFeedback({
        weekly_log_id: logId,
        decision: form.decision || "COMMENT",
        comment: form.comment.trim(),
        score: numericScore,
        is_latest: true,
      });

      setForms((previous) => ({
        ...previous,
        [logId]: {
          decision: "COMMENT",
          comment: "",
          score: "",
        },
      }));

      setMessage("Feedback and score submitted.");
      loadLogs();
    } catch (err) {
      setError(err.message || "Failed to submit feedback.");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Student Weekly Logs</h1>
        <p>Loading weekly logs...</p>
      </div>
    );
  }

  const reviewableLogs = logs.filter((log) => log.status !== "DRAFT");

  return (
    <div style={{ padding: "30px" }}>
      <h1>Student Weekly Logs</h1>

      <p>
        Review assigned students’ submitted weekly logs. Student entries are
        read-only.
      </p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {reviewableLogs.length === 0 ? (
        <p>No submitted weekly logs found.</p>
      ) : (
        reviewableLogs.map((log) => {
          const myFeedback = getMyFeedback(log);
          const feedbackEntries = asArray(log.feedback_entries);

          return (
            <div key={log.id} style={boxStyle}>
              <h2>
                Week {log.week_number}: {log.title}
              </h2>

              <p>
                <strong>Student:</strong>{" "}
                {log.placement?.student?.user?.username || "-"}
              </p>

              <p>
                <strong>Registration Number:</strong>{" "}
                {log.placement?.student?.registration_number || "-"}
              </p>

              <p>
                <strong>Company:</strong>{" "}
                {log.placement?.company?.company_name || "-"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`badge badge-${String(
                    log.status || ""
                  ).toLowerCase()}`}
                >
                  {log.status || "-"}
                </span>
              </p>

              <p>
                <strong>Submitted At:</strong> {getSubmissionTime(log)}
              </p>

              <h3>Weekly Log Evaluation Summary</h3>

              <p>
                <strong>Academic Supervisor Score:</strong>{" "}
                {displayScore(log.academic_score, "Not marked yet")}
              </p>

              <p>
                <strong>Workplace Supervisor Score:</strong>{" "}
                {displayScore(log.workplace_score, "Not marked yet")}
              </p>

              <p>
                <strong>Final Weekly Log Mark:</strong>{" "}
                {displayScore(log.average_score, "Pending both supervisor scores")}
              </p>

              <p>
                <strong>Fully Assessed:</strong>{" "}
                {log.is_fully_assessed ? "Yes" : "No"}
              </p>

              <h3>Student Activities</h3>

              <p>
                <strong>Monday:</strong> {log.monday_activities || "-"}
              </p>

              <p>
                <strong>Tuesday:</strong> {log.tuesday_activities || "-"}
              </p>

              <p>
                <strong>Wednesday:</strong> {log.wednesday_activities || "-"}
              </p>

              <p>
                <strong>Thursday:</strong> {log.thursday_activities || "-"}
              </p>

              <p>
                <strong>Friday:</strong> {log.friday_activities || "-"}
              </p>

              <p>
                <strong>Challenges:</strong> {log.challenges || "-"}
              </p>

              <p>
                <strong>Lessons Learned:</strong>{" "}
                {log.lessons_learned || "-"}
              </p>

              <h3>Existing Feedback</h3>

              {feedbackEntries.length === 0 ? (
                <p>No feedback submitted yet.</p>
              ) : (
                feedbackEntries.map((feedback) => (
                  <div key={feedback.id} style={innerBoxStyle}>
                    <p>
                      <strong>Supervisor:</strong>{" "}
                      {feedback.supervisor?.user?.username || "-"}
                    </p>

                    <p>
                      <strong>Supervisor Type:</strong>{" "}
                      {feedback.supervisor?.supervisor_type || "-"}
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
                      {displayScore(feedback.score, "-")}
                    </p>

                    <p>
                      <strong>Comment:</strong> {feedback.comment || "-"}
                    </p>
                  </div>
                ))
              )}

              {myFeedback ? (
                <div style={myFeedbackStyle}>
                  <h3>Your Feedback Already Submitted</h3>

                  <p>
                    You have already submitted feedback for this weekly log. You
                    cannot submit another feedback entry for the same weekly log.
                  </p>

                  <p>
                    <strong>Feedback Sent At:</strong>{" "}
                    {myFeedback.created_at
                      ? formatDateTime(myFeedback.created_at)
                      : "-"}
                  </p>

                  <p>
                    <strong>Decision:</strong> {myFeedback.decision || "-"}
                  </p>

                  <p>
                    <strong>Score:</strong> {displayScore(myFeedback.score, "-")}
                  </p>

                  <p>
                    <strong>Comment:</strong> {myFeedback.comment || "-"}
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const boxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "14px",
  background: "#fff",
};

const innerBoxStyle = {
  border: "1px solid #eee",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "12px",
  background: "#fafafa",
};

const myFeedbackStyle = {
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  padding: "14px",
  marginTop: "16px",
  background: "#f0fdf4",
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