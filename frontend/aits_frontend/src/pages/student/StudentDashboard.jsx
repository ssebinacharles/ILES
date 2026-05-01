import { useEffect, useState } from "react";

import { getPlacements } from "../../api/placementsApi";
import {
  getWeeklyLogs,
  createWeeklyLog,
  submitWeeklyLog,
  getMyWeeklyLogEvaluations,
} from "../../api/weeklyLogsApi";
import { getEvaluations } from "../../api/evaluationsApi";
import { getFinalResults } from "../../api/finalResultsApi";

import PerformanceTrendChart from "../../components/common/PerformanceTrendChart";

import {
  asArray,
  countByStatus,
  formatDateTime,
} from "../../utils/dashboardHelpers";

function StudentDashboard() {
  const [placements, setPlacements] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [performanceEvaluations, setPerformanceEvaluations] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [finalResults, setFinalResults] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [logForm, setLogForm] = useState({
    placement_id: "",
    week_number: "",
    title: "",
    monday_activities: "",
    tuesday_activities: "",
    wednesday_activities: "",
    thursday_activities: "",
    friday_activities: "",
    challenges: "",
    lessons_learned: "",
  });

  function loadDashboard() {
    Promise.all([
      getPlacements(),
      getWeeklyLogs(),
      getMyWeeklyLogEvaluations(),
      getEvaluations(),
      getFinalResults(),
    ])
      .then(([placementData, logData, performanceData, evaluationData, resultData]) => {
        const placementsArray = asArray(placementData);

        setPlacements(placementsArray);
        setWeeklyLogs(asArray(logData));
        setPerformanceEvaluations(asArray(performanceData));
        setEvaluations(asArray(evaluationData));
        setFinalResults(asArray(resultData));

        setLogForm((previous) => ({
          ...previous,
          placement_id: placementsArray[0]?.id || "",
        }));

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load dashboard.");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function handleLogChange(event) {
    const { name, value } = event.target;

    setLogForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function buildActivitySummary() {
    return [
      `Monday: ${logForm.monday_activities}`,
      `Tuesday: ${logForm.tuesday_activities}`,
      `Wednesday: ${logForm.wednesday_activities}`,
      `Thursday: ${logForm.thursday_activities}`,
      `Friday: ${logForm.friday_activities}`,
    ].join("\n");
  }

  async function saveDraft() {
    setMessage("");
    setError("");

    try {
      await createWeeklyLog({
        ...logForm,
        week_number: Number(logForm.week_number),
        placement_id: Number(logForm.placement_id),
        activities: buildActivitySummary(),
      });

      setMessage("Weekly log draft saved.");
      loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to save draft.");
    }
  }

  async function saveAndSubmit() {
    setMessage("");
    setError("");

    try {
      const createdLog = await createWeeklyLog({
        ...logForm,
        week_number: Number(logForm.week_number),
        placement_id: Number(logForm.placement_id),
        activities: buildActivitySummary(),
      });

      await submitWeeklyLog(createdLog.id);

      setMessage("Weekly log submitted successfully.");
      loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to submit weekly log.");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Student Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  const statusCounts = countByStatus(weeklyLogs);

  const feedbackCount = weeklyLogs.reduce((total, log) => {
    return total + asArray(log.feedback_entries).length;
  }, 0);

  const currentPlacement = placements[0];
  const latestResult = finalResults[0];

  return (
    <div style={{ padding: "30px" }}>
      <h1>Student Dashboard</h1>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={gridStyle}>
        <Card
          title="Current Placement"
          value={currentPlacement ? currentPlacement.company?.company_name : "None"}
        />
        <Card title="Weekly Logs" value={weeklyLogs.length} />
        <Card title="Submitted Logs" value={statusCounts.SUBMITTED || 0} />
        <Card title="Approved Logs" value={statusCounts.APPROVED || 0} />
        <Card title="Feedback Received" value={feedbackCount} />
        <Card title="Final Mark" value={latestResult?.final_mark || "N/A"} />
      </div>

      <section style={sectionStyle}>
        <PerformanceTrendChart
          evaluations={performanceEvaluations}
          title="My Weekly Performance Trend"
        />
      </section>

      <section style={sectionStyle}>
        <h2>Current Placement</h2>

        {currentPlacement ? (
          <div style={boxStyle}>
            <p>
              <strong>Company:</strong>{" "}
              {currentPlacement.company?.company_name}
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {currentPlacement.company?.location}
            </p>
            <p>
              <strong>Status:</strong> {currentPlacement.status}
            </p>
            <p>
              <strong>Period:</strong> {currentPlacement.start_date} to{" "}
              {currentPlacement.end_date}
            </p>
            <p>
              <strong>Workplace Supervisor:</strong>{" "}
              {currentPlacement.workplace_supervisor_name || "Not yet confirmed"}
            </p>
          </div>
        ) : (
          <p>No placement found.</p>
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Create Weekly Log</h2>

        {placements.length === 0 ? (
          <p>You need an internship placement before creating weekly logs.</p>
        ) : (
          <div style={formStyle}>
            <label>
              Placement
              <select
                name="placement_id"
                value={logForm.placement_id}
                onChange={handleLogChange}
                style={inputStyle}
              >
                {placements.map((placement) => (
                  <option key={placement.id} value={placement.id}>
                    {placement.company?.company_name} - {placement.status}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Week Number"
              name="week_number"
              type="number"
              value={logForm.week_number}
              onChange={handleLogChange}
            />

            <Input
              label="Title"
              name="title"
              value={logForm.title}
              onChange={handleLogChange}
            />

            <TextArea
              label="Monday Activities"
              name="monday_activities"
              value={logForm.monday_activities}
              onChange={handleLogChange}
            />

            <TextArea
              label="Tuesday Activities"
              name="tuesday_activities"
              value={logForm.tuesday_activities}
              onChange={handleLogChange}
            />

            <TextArea
              label="Wednesday Activities"
              name="wednesday_activities"
              value={logForm.wednesday_activities}
              onChange={handleLogChange}
            />

            <TextArea
              label="Thursday Activities"
              name="thursday_activities"
              value={logForm.thursday_activities}
              onChange={handleLogChange}
            />

            <TextArea
              label="Friday Activities"
              name="friday_activities"
              value={logForm.friday_activities}
              onChange={handleLogChange}
            />

            <TextArea
              label="Challenges"
              name="challenges"
              value={logForm.challenges}
              onChange={handleLogChange}
            />

            <TextArea
              label="Lessons Learned"
              name="lessons_learned"
              value={logForm.lessons_learned}
              onChange={handleLogChange}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={saveDraft}>Save Draft</button>
              <button onClick={saveAndSubmit}>Save & Submit</button>
            </div>
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Recent Weekly Logs</h2>

        {weeklyLogs.length === 0 ? (
          <p>No weekly logs found.</p>
        ) : (
          weeklyLogs.slice(0, 5).map((log) => (
            <div key={log.id} style={boxStyle}>
              <h3>
                Week {log.week_number}: {log.title}
              </h3>
              <p>
                <strong>Status:</strong> {log.status}
              </p>
              <p>
                <strong>Submitted:</strong> {formatDateTime(log.submitted_at)}
              </p>
              <p>
                <strong>Feedback:</strong>{" "}
                {asArray(log.feedback_entries).length}
              </p>
            </div>
          ))
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Evaluation Summary</h2>

        {evaluations.length === 0 ? (
          <p>No evaluations found.</p>
        ) : (
          evaluations.map((evaluation) => (
            <div key={evaluation.id} style={boxStyle}>
              <h3>{evaluation.evaluation_type}</h3>
              <p>
                <strong>Status:</strong> {evaluation.status}
              </p>
              <p>
                <strong>Total Score:</strong> {evaluation.total_score}
              </p>
              <p>
                <strong>Weighted Score:</strong> {evaluation.weighted_score}
              </p>
              <p>
                <strong>Remarks:</strong> {evaluation.remarks || "-"}
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={cardStyle}>
      <h2>{value}</h2>
      <p>{title}</p>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label>
      {label}
      <input {...props} style={inputStyle} />
    </label>
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

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginTop: "20px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "20px",
  background: "#f9f9f9",
};

const sectionStyle = {
  marginTop: "30px",
};

const boxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "15px",
  marginBottom: "12px",
};

const formStyle = {
  display: "grid",
  gap: "12px",
  maxWidth: "700px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

export default StudentDashboard;