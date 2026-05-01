import { useEffect, useState } from "react";

import { getStudents } from "../../api/usersApi";
import { getStudentFinalResult } from "../../api/finalResultsApi";

function AdminResultsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function normalize(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.results)) return response.results;
    return [];
  }

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        const studentsResponse = await getStudents();
        const students = normalize(studentsResponse);

        const resultResponses = await Promise.allSettled(
          students.map((student) => getStudentFinalResult(student.id))
        );

        const combinedRows = students.map((student, index) => {
          const outcome = resultResponses[index];

          return {
            student,
            result:
              outcome.status === "fulfilled"
                ? outcome.value
                : null,
            error:
              outcome.status === "rejected"
                ? outcome.reason?.message || "No result found"
                : "",
          };
        });

        setRows(combinedRows);
      } catch (err) {
        setError(err.message || "Failed to load final results.");
      } finally {
        setLoading(false);
      }
    }

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
        weekly logs.
      </p>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {rows.length === 0 ? (
        <p>No students found.</p>
      ) : (
        rows.map(({ student, result, error }) => (
          <div key={student.id} style={cardStyle}>
            <h2>
              {student.registration_number} -{" "}
              {student.full_name || student.username || "Student"}
            </h2>

            <p>
              <strong>Course:</strong> {student.course || "-"}
            </p>

            <p>
              <strong>Department:</strong> {student.department || "-"}
            </p>

            {!result ? (
              <p style={{ color: "#b45309" }}>
                {error || "No result found for this student yet."}
              </p>
            ) : (
              <>
                <p>
                  <strong>Final Mark:</strong> {result.final_mark}%
                </p>

                <p>
                  <strong>Assessed Weekly Logs:</strong>{" "}
                  {result.assessed_weekly_logs_count ?? 0}
                </p>

                <p>
                  <strong>Average Weekly Logs Score:</strong>{" "}
                  {result.weekly_logs_score}%
                </p>

                <p>
                  <strong>Published At:</strong>{" "}
                  {result.published_at
                    ? new Date(result.published_at).toLocaleString()
                    : "Not published yet"}
                </p>

                {result.placement?.company && (
                  <p>
                    <strong>Company:</strong>{" "}
                    {result.placement.company.company_name}
                  </p>
                )}
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