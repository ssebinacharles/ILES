import { useEffect, useState } from "react";

import {
  getWeeklyLogs,
  updateWeeklyLog,
  submitWeeklyLog,
} from "../../api/weeklyLogsApi";

import { asArray, formatDateTime } from "../../utils/dashboardHelpers";

function StudentsWeeklyLogsPage() {
  const [logs, setLogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
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

  function startEdit(log) {
    setEditingId(log.id);
    setEditForm(log);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveEdit() {
    setMessage("");
    setError("");

    try {
      await updateWeeklyLog(editingId, editForm);
      setEditingId(null);
      setMessage("Draft weekly log updated.");
      loadLogs();
    } catch (err) {
      setError(err.message || "Failed to update weekly log.");
    }
  }

  async function submitLog(id) {
    setMessage("");
    setError("");

    try {
      await submitWeeklyLog(id);
      setMessage("Weekly log submitted.");
      loadLogs();
    } catch (err) {
      setError(err.message || "Failed to submit weekly log.");
    }
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>My Weekly Logs</h1>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {logs.length === 0 ? (
        <p>No weekly logs found.</p>
      ) : (
        logs.map((log) => (
          <div key={log.id} style={boxStyle}>
            <h2>Week {log.week_number}: {log.title}</h2>

            <p><strong>Student:</strong> {log.placement?.student?.user?.username || "Student"}</p>
            <p><strong>Registration Number:</strong> {log.placement?.student?.registration_number || "-"}</p>
            <p><strong>Status:</strong> {log.status}</p>
            <p><strong>Time of Submission:</strong> {formatDateTime(log.submitted_at)}</p>

            {editingId === log.id ? (
              <div style={formStyle}>
                <TextArea label="Monday" name="monday_activities" value={editForm.monday_activities || ""} onChange={handleChange} />
                <TextArea label="Tuesday" name="tuesday_activities" value={editForm.tuesday_activities || ""} onChange={handleChange} />
                <TextArea label="Wednesday" name="wednesday_activities" value={editForm.wednesday_activities || ""} onChange={handleChange} />
                <TextArea label="Thursday" name="thursday_activities" value={editForm.thursday_activities || ""} onChange={handleChange} />
                <TextArea label="Friday" name="friday_activities" value={editForm.friday_activities || ""} onChange={handleChange} />
                <TextArea label="Challenges" name="challenges" value={editForm.challenges || ""} onChange={handleChange} />
                <TextArea label="Lessons Learned" name="lessons_learned" value={editForm.lessons_learned || ""} onChange={handleChange} />

                <button onClick={saveEdit}>Save Changes</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <p><strong>Monday:</strong> {log.monday_activities || "-"}</p>
                <p><strong>Tuesday:</strong> {log.tuesday_activities || "-"}</p>
                <p><strong>Wednesday:</strong> {log.wednesday_activities || "-"}</p>
                <p><strong>Thursday:</strong> {log.thursday_activities || "-"}</p>
                <p><strong>Friday:</strong> {log.friday_activities || "-"}</p>
                <p><strong>Challenges:</strong> {log.challenges || "-"}</p>
                <p><strong>Lessons Learned:</strong> {log.lessons_learned || "-"}</p>

                <h3>Feedback</h3>

                {asArray(log.feedback_entries).length === 0 ? (
                  <p>No feedback yet.</p>
                ) : (
                  asArray(log.feedback_entries).map((feedback) => (
                    <div key={feedback.id} style={innerBoxStyle}>
                      <p><strong>Supervisor:</strong> {feedback.supervisor?.user?.username || "-"}</p>
                      <p><strong>Decision:</strong> {feedback.decision}</p>
                      <p><strong>Score:</strong> {feedback.score || "-"}</p>
                      <p><strong>Comment:</strong> {feedback.comment}</p>
                    </div>
                  ))
                )}

                {log.status === "DRAFT" ? (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => startEdit(log)}>Edit Draft</button>
                    <button onClick={() => submitLog(log.id)}>Submit Log</button>
                  </div>
                ) : (
                  <p style={{ color: "gray" }}>Submitted logs cannot be edited.</p>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label>
      {label}
      <textarea {...props} style={inputStyle} />
    </label>
  );
}

const boxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "14px",
};

const innerBoxStyle = {
  border: "1px solid #eee",
  borderRadius: "8px",
  padding: "10px",
  marginBottom: "10px",
  background: "#fafafa",
};

const formStyle = {
  display: "grid",
  gap: "10px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

export default StudentsWeeklyLogsPage;