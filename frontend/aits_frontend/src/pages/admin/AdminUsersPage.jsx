import PerformanceTrendChart from "../../components/common/PerformanceTrendChart";
import { useEffect, useState } from "react";

import {
  getUsers,
  getStudents,
  getSupervisors,
  getAdministrators,
} from "../../api/usersApi";

import { getStudentWeeklyLogEvaluations } from "../../api/weeklyLogsApi";
import { getStudentFinalResult } from "../../api/finalResultsApi";

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

  useEffect(() => {
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
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function handleViewStudentDetails(student) {
    setSelectedStudent(student);
    setStudentEvaluations([]);
    setStudentResult(null);
    setDetailsError("");
    setDetailsLoading(true);

    const evaluationsResponse = await Promise.allSettled([
      getStudentWeeklyLogEvaluations(student.id),
      getStudentFinalResult(student.id),
    ]);

    const evaluationsOutcome = evaluationsResponse[0];
    const resultOutcome = evaluationsResponse[1];

    if (evaluationsOutcome.status === "fulfilled") {
      setStudentEvaluations(normalize(evaluationsOutcome.value));
    } else {
      setDetailsError(
        evaluationsOutcome.reason?.message ||
          "Failed to load student evaluations."
      );
    }

    if (resultOutcome.status === "fulfilled") {
      setStudentResult(resultOutcome.value);
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
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Users Management</h1>

      <section style={sectionStyle}>
        <h2>All Users</h2>
        {data.users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          data.users.map((user) => (
            <div key={user.id} style={cardStyle}>
              <strong>{user.username}</strong>
              <p>Email: {user.email}</p>
              <p>Role: {user.role}</p>
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
              <strong>{student.registration_number}</strong>

              <p> 
                Name: {student.full_name || student.username || "Student"}
              </p>

              <p>Course: {student.course}</p>
              <p>Department: {student.department}</p>

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
          <h2>
            Student Performance: {selectedStudent.registration_number}
          </h2>

          {detailsLoading && <p>Loading student evaluations and results...</p>}

          {detailsError && (
            <p style={{ color: "red" }}>Error: {detailsError}</p>
          )}

          {!detailsLoading && (
            <>
              <div style={sectionStyle}>
                <h3>My Evaluations</h3>
                <PerformanceTrendChart
                  evaluations={studentEvaluations}
                  title={`${selectedStudent.registration_number} Performance Trend`}
                />

                {studentEvaluations.length === 0 ? (
                  <p>No assessed weekly logs found for this student yet.</p>
                ) : (
                  studentEvaluations.map((evaluation) => (
                    <div key={evaluation.id} style={cardStyle}>
                      <h4>Week {evaluation.week_number}</h4>

                      <p>
                        <strong>Title:</strong> {evaluation.title}
                      </p>

                      <p>
                        <strong>Status:</strong> {evaluation.status}
                      </p>

                      <p>
                        <strong>Academic Supervisor Score:</strong>{" "}
                        {evaluation.academic_score !== null
                          ? `${evaluation.academic_score}%`
                          : "Not marked yet"}
                      </p>

                      <p>
                        <strong>Workplace Supervisor Score:</strong>{" "}
                        {evaluation.workplace_score !== null
                          ? `${evaluation.workplace_score}%`
                          : "Not marked yet"}
                      </p>

                      <p>
                        <strong>Final Weekly Log Mark:</strong>{" "}
                        {evaluation.average_score !== null
                          ? `${evaluation.average_score}%`
                          : "Pending"}
                      </p>

                      <p>
                        <strong>Fully Assessed:</strong>{" "}
                        {evaluation.is_fully_assessed ? "Yes" : "No"}
                      </p>

                      {evaluation.company && (
                        <p>
                          <strong>Company:</strong>{" "}
                          {evaluation.company.company_name}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div style={sectionStyle}>
                <h3>My Results</h3>

                {!studentResult ? (
                  <p>No result found for this student yet.</p>
                ) : (
                  <div style={cardStyle}>
                    <h4>Final Mark: {studentResult.final_mark}%</h4>

                    <p>
                      <strong>Assessed Weekly Logs:</strong>{" "}
                      {studentResult.assessed_weekly_logs_count ?? 0}
                    </p>

                    <p>
                      <strong>Average Weekly Logs Score:</strong>{" "}
                      {studentResult.weekly_logs_score}%
                    </p>

                    <p>
                      <strong>Supervisor Evaluation Score:</strong>{" "}
                      {studentResult.supervisor_evaluation_score}%
                    </p>

                    <p>
                      <strong>Final Report Score:</strong>{" "}
                      {studentResult.final_report_score}%
                    </p>

                    <p>
                      <strong>Workplace Assessment Score:</strong>{" "}
                      {studentResult.workplace_assessment_score}%
                    </p>

                    <p>
                      <strong>Published At:</strong>{" "}
                      {studentResult.published_at
                        ? new Date(studentResult.published_at).toLocaleString()
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
              <strong>{supervisor.user?.username || "Supervisor"}</strong>
              <p>Type: {supervisor.supervisor_type}</p>
              <p>Organization: {supervisor.organization_name}</p>
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
              <strong>{admin.user?.username || "Administrator"}</strong>
              <p>Office: {admin.office_name}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const sectionStyle = {
  marginTop: "25px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "10px",
};

const buttonStyle = {
  padding: "8px 12px",
  cursor: "pointer",
  marginTop: "8px",
};

export default AdminUsersPage;