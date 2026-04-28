import { useEffect, useState } from "react";

import {
  getUsers,
  getStudents,
  getSupervisors,
  getAdministrators,
} from "../../api/usersApi";

function AdminUsersPage() {
  const [data, setData] = useState({
    users: [],
    students: [],
    supervisors: [],
    administrators: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function normalize(response) {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.results)) return response.results;
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
              <p>Course: {student.course}</p>
              <p>Department: {student.department}</p>
            </div>
          ))
        )}
      </section>

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

export default AdminUsersPage;