import { useEffect, useState } from "react";

import PerformanceTrendChart from "../../components/common/PerformanceTrendChart";

import {
  getUsers,
  getStudents,
  getSupervisors,
  getAdministrators,
} from "../../api/usersApi";

import { getStudentWeeklyLogEvaluations } from "../../api/weeklyLogsApi";
import { getStudentFinalResult } from "../../api/finalResultsApi";
import { formatDateTime } from "../../utils/dashboardHelpers";

function AdminUsersPage() {
  const [data, setData] = useState({
    users: [],
    students: [],
    supervisors: [],
    administrators: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [studentResult, setStudentResult] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  function normalize(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.results)) return response.results;
    if (response && typeof response === "object") return [response];
    return [];
  }

  function displayScore(value) {
    if (value === null || value === undefined || value === "") {
      return "Not available";
    }

    return `${value}%`;
  }

  function getUserName(user) {
    if (!user) return "-";

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    return fullName || user.username || "-";
  }

  function loadUsers() {
    setLoading(true);
    setError("");

    Promise.all([
      getUsers(),
      getStudents(),
      getSupervisors(),
      getAdministrators(),
    ])
      .then(([users, students, supervisors, administrators]) => {
        setData({
          users: normalize(users),
          students: normalize(students),
          supervisors: normalize(supervisors),
          administrators: normalize(administrators),
        });

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load users.");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleViewStudentDetails(student) {
    setSelectedStudent(student);
    setStudentEvaluations([]);
    setStudentResult(null);
    setDetailsError("");
    setDetailsLoading(true);

    const responses = await Promise.allSettled([
      getStudentWeeklyLogEvaluations(student.id),
      getStudentFinalResult(student.id),
    ]);

    const evaluationsOutcome = responses[0];
    const resultOutcome = responses[1];

    if (evaluationsOutcome.status === "fulfilled") {
      setStudentEvaluations(normalize(evaluationsOutcome.value));
    } else {
      setDetailsError(
        evaluationsOutcome.reason?.message ||
          "Failed to load student evaluations."
      );
    }

    if (resultOutcome.status === "fulfilled") {
      const normalizedResult = normalize(resultOutcome.value);
      setStudentResult(normalizedResult[0] || null);
    } else {
      setStudentResult(null);
    }

    setDetailsLoading(false);
  }

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Users Management</h1>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>Users Management</h1>
        <p style={{ color: "red" }}>Error: {error}</p>
        <button onClick={loadUsers} style={buttonStyle}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Users Management</h1>

      <p>
        View students, supervisors, administrators, student evaluations, and
        student final results.
      </p>

      <section style={sectionStyle}>
        <h2>Summary</h2>

        <div style={gridStyle}>
          <SummaryCard title="All Users" value={data.users.length} />
          <SummaryCard title="Students" value={data.students.length} />
          <SummaryCard title="Supervisors" value={data.supervisors.length} />
          <SummaryCard
            title="Administrators"
            value={data.administrators.length}
          />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>All Users</h2>

        {data.users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          data.users.map((user) => (
            <div key={user.id} style={cardStyle}>
              <strong>{getUserName(user)}</strong>

              <p>
                <strong>Username:</strong> {user.username || "-"}
              </p>

              <p>
                <strong>Email:</strong> {user.email || "-"}
              </p>

              <p>
                <strong>Role:</strong> {user.role || "-"}
              </p>
            </div>
          ))
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Students</h2>

        {data.students.length === 0 ? (
          <p>No student profiles found.</p>
        ) : (
          data.students.map((student) => (
            <div key={student.id} style={cardStyle}>
              <h3>{student.registration_number || "Student"}</h3>

              <p>
                <strong>Name:</strong>{" "}
                {student.full_name ||
                  student.username ||
                  getUserName(student.user) ||
                  "Student"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {student.email || student.user?.email || "-"}
              </p>

              <p>
                <strong>Course:</strong> {student.course || "-"}
              </p>

              <p>
                <strong>Department:</strong> {student.department || "-"}
              </p>

              <p>
                <strong>Year of Study:</strong>{" "}
                {student.year_of_study || "-"}
              </p>

              <button
                onClick={() => handleViewStudentDetails(student)}
                style={buttonStyle}
              >
                View Evaluations & Results
              </button>
            </div>
          ))
        )}
      </section>

      {selectedStudent && (
        <section style={sectionStyle}>
          <h2>Student Performance: {selectedStudent.registration_number}</h2>

          <div style={cardStyle}>
            <p>
              <strong>Student:</strong>{" "}
              {selectedStudent.full_name ||
                selectedStudent.username ||
                getUserName(selectedStudent.user) ||
                "-"}
            </p>

            <p>
              <strong>Registration Number:</strong>{" "}
              {selectedStudent.registration_number || "-"}
            </p>

            <p>
              <strong>Course:</strong> {selectedStudent.course || "-"}
            </p>

            <p>
              <strong>Department:</strong>{" "}
              {selectedStudent.department || "-"}
            </p>
          </div>

          {detailsLoading && <p>Loading student evaluations and results...</p>}

          {detailsError && <p style={{ color: "red" }}>Error: {detailsError}</p>}

          {!detailsLoading && (
            <>
              <div style={sectionStyle}>
                <h3>Weekly Log Evaluations</h3>

                <PerformanceTrendChart
                  evaluations={studentEvaluations}
                  title={`${selectedStudent.registration_number} Performance Trend`}
                />

                {studentEvaluations.length === 0 ? (
                  <p>No assessed weekly logs found for this student yet.</p>
                ) : (
                  studentEvaluations.map((evaluation) => (
                    <div key={evaluation.id} style={cardStyle}>
                      <h4>
                        Week {evaluation.week_number}: {evaluation.title}
                      </h4>

                      <p>
                        <strong>Status:</strong> {evaluation.status || "-"}
                      </p>

                      <p>
                        <strong>Submitted At:</strong>{" "}
                        {evaluation.submitted_at
                          ? formatDateTime(evaluation.submitted_at)
                          : "Not submitted yet"}
                      </p>

                      <p>
                        <strong>Academic Supervisor Score:</strong>{" "}
                        {displayScore(evaluation.academic_score)}
                      </p>

                      <p>
                        <strong>Workplace Supervisor Score:</strong>{" "}
                        {displayScore(evaluation.workplace_score)}
                      </p>

                      <p>
                        <strong>Final Weekly Log Mark:</strong>{" "}
                        {displayScore(evaluation.average_score)}
                      </p>

                      <p>
                        <strong>Fully Assessed:</strong>{" "}
                        {evaluation.is_fully_assessed ? "Yes" : "No"}
                      </p>

                      <p>
                        <strong>Company:</strong>{" "}
                        {evaluation.company?.company_name || "-"}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div style={sectionStyle}>
                <h3>Final Result</h3>

                {!studentResult ? (
                  <p>No result found for this student yet.</p>
                ) : (
                  <div style={resultCardStyle}>
                    <h4>Final Mark: {displayScore(studentResult.final_mark)}</h4>

                    <p>
                      <strong>Assessed Weekly Logs:</strong>{" "}
                      {studentResult.assessed_weekly_logs_count ?? 0}
                    </p>

                    <p>
                      <strong>Average Weekly Logs Score:</strong>{" "}
                      {displayScore(studentResult.weekly_logs_score)}
                    </p>

                    <p>
                      <strong>Supervisor Evaluation Score:</strong>{" "}
                      {displayScore(studentResult.supervisor_evaluation_score)}
                    </p>

                    <p>
                      <strong>Workplace Assessment Score:</strong>{" "}
                      {displayScore(studentResult.workplace_assessment_score)}
                    </p>

                    <p>
                      <strong>Final Report Score:</strong>{" "}
                      {displayScore(studentResult.final_report_score)}
                    </p>

                    <p>
                      <strong>Published At:</strong>{" "}
                      {studentResult.published_at
                        ? formatDateTime(studentResult.published_at)
                        : "Not published yet"}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <section style={sectionStyle}>
        <h2>Supervisors</h2>

        {data.supervisors.length === 0 ? (
          <p>No supervisor profiles found.</p>
        ) : (
          data.supervisors.map((supervisor) => (
            <div key={supervisor.id} style={cardStyle}>
              <h3>{getUserName(supervisor.user) || "Supervisor"}</h3>

              <p>
                <strong>Username:</strong>{" "}
                {supervisor.user?.username || "-"}
              </p>

              <p>
                <strong>Email:</strong> {supervisor.user?.email || "-"}
              </p>

              <p>
                <strong>Type:</strong> {supervisor.supervisor_type || "-"}
              </p>

              <p>
                <strong>Organization:</strong>{" "}
                {supervisor.organization_name || "-"}
              </p>

              <p>
                <strong>Title:</strong> {supervisor.title || "-"}
              </p>
            </div>
          ))
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Administrators</h2>

        {data.administrators.length === 0 ? (
          <p>No administrator profiles found.</p>
        ) : (
          data.administrators.map((admin) => (
            <div key={admin.id} style={cardStyle}>
              <h3>{getUserName(admin.user) || "Administrator"}</h3>

              <p>
                <strong>Username:</strong> {admin.user?.username || "-"}
              </p>

              <p>
                <strong>Email:</strong> {admin.user?.email || "-"}
              </p>

              <p>
                <strong>Office:</strong> {admin.office_name || "-"}
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div style={summaryCardStyle}>
      <h2>{value}</h2>
      <p>{title}</p>
    </div>
  );
}

const sectionStyle = {
  marginTop: "25px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
};

const summaryCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  background: "#f9f9f9",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "14px",
  marginBottom: "12px",
  background: "#fff",
};

const resultCardStyle = {
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  padding: "14px",
  marginBottom: "12px",
  background: "#f0fdf4",
};

const buttonStyle = {
  padding: "8px 12px",
  cursor: "pointer",
  marginTop: "8px",
};

export default AdminUsersPage;