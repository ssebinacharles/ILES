import { useEffect, useState } from "react";

import { getStudents } from "../../api/usersApi";
import { getStudentFinalResult } from "../../api/finalResultsApi";

import {
  asArray,
  displayScore,
  formatDateTime,
} from "../../utils/dashboardHelpers";

function AdminResultsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function getStudentName(student) {
    if (!student) return "Student";

    const fullName =
      student.full_name ||
      `${student.user?.first_name || ""} ${student.user?.last_name || ""}`.trim();

    return fullName || student.username || student.user?.username || "Student";
  }

  async function loadResults() {
    try {
      setLoading(true);
      setError("");

      const studentsResponse = await getStudents();
      const students = asArray(studentsResponse);

      const resultResponses = await Promise.allSettled(
        students.map((student) => getStudentFinalResult(student.id))
      );

      const combinedRows = students.map((student, index) => {
        const outcome = resultResponses[index];

        if (outcome.status === "fulfilled") {
          const normalizedResult = asArray(outcome.value);

          return {
            student,
            result: normalizedResult[0] || null,
            error: "",
          };
        }

        return {
          student,
          result: null,
          error: outcome.reason?.message || "No result found",
        };
      });

      setRows(combinedRows);
    } catch (err) {
      setError(err.message || "Failed to load final results.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Final Results</h1>
        <p>Loading final results...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Final Results</h1>

      <p>
        This page shows each student’s internship result based on assessed
        weekly logs, supervisor evaluation, workplace assessment, final report,
        and final mark.
      </p>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {rows.length === 0 ? (
        <p>No students found.</p>
      ) : (
        rows.map(({ student, result, error }) => (
          <div key={student.id} style={cardStyle}>
            <h2>
              {student.registration_number || "-"} - {getStudentName(student)}
            </h2>

            <p>
              <strong>Course:</strong> {student.course || "-"}
            </p>

            <p>
              <strong>Department:</strong> {student.department || "-"}
            </p>

            <p>
              <strong>Year of Study:</strong> {student.year_of_study || "-"}
            </p>

            {!result ? (
              <p style={{ color: "#b45309" }}>
                {error || "No result found for this student yet."}
              </p>
            ) : (
              <>
                <h3>Result Summary</h3>

                <p>
                  <strong>Final Mark:</strong>{" "}
                  {displayScore(result.final_mark)}
                </p>

                <p>
                  <strong>Assessed Weekly Logs:</strong>{" "}
                  {result.assessed_weekly_logs_count ?? 0}
                </p>

                <p>
                  <strong>Average Weekly Logs Score:</strong>{" "}
                  {displayScore(result.weekly_logs_score)}
                </p>

                <p>
                  <strong>Supervisor Evaluation Score:</strong>{" "}
                  {displayScore(result.supervisor_evaluation_score)}
                </p>

                <p>
                  <strong>Workplace Assessment Score:</strong>{" "}
                  {displayScore(result.workplace_assessment_score)}
                </p>

                <p>
                  <strong>Final Report Score:</strong>{" "}
                  {displayScore(result.final_report_score)}
                </p>

                <p>
                  <strong>Published At:</strong>{" "}
                  {result.published_at
                    ? formatDateTime(result.published_at)
                    : "Not published yet"}
                </p>

                <h3>Placement Details</h3>

                <p>
                  <strong>Company:</strong>{" "}
                  {result.placement?.company?.company_name || "-"}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {result.placement?.company?.location || "-"}
                </p>

                <p>
                  <strong>Placement Status:</strong>{" "}
                  {result.placement?.status || "-"}
                </p>

                <p>
                  <strong>Internship Period:</strong>{" "}
                  {result.placement?.start_date || "-"} to{" "}
                  {result.placement?.end_date || "-"}
                </p>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "14px",
  backgroundColor: "#fff",
};

export default AdminResultsPage;