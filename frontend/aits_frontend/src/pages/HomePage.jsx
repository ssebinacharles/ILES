function HomePage({ onChooseLogin }) {
  return (
    <div style={pageStyle}>
      <h1>Internship Logging & Evaluation System</h1>
      <p>Select your user type to login.</p>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2>Student</h2>
          <p>Login to view placements, weekly logs, and final results.</p>
          <button onClick={() => onChooseLogin("STUDENT")}>
            Student Login
          </button>
        </div>

        <div style={cardStyle}>
          <h2>Supervisor</h2>
          <p>Login as an academic or workplace supervisor.</p>

          <div style={buttonGroupStyle}>
            <button onClick={() => onChooseLogin("SUPERVISOR", "ACADEMIC")}>
              Academic Supervisor
            </button>

            <button onClick={() => onChooseLogin("SUPERVISOR", "WORKPLACE")}>
              Workplace Supervisor
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <h2>Internship Administrator</h2>
          <p>Login to manage users, placements, assignments, and results.</p>
          <button onClick={() => onChooseLogin("ADMINISTRATOR")}>
            Internship Admin Login
          </button>
        </div>

        <div style={cardStyle}>
          <h2>System Admin</h2>
          <p>For superuser/staff access to system-level management.</p>

          <div style={buttonGroupStyle}>
            <button onClick={() => onChooseLogin("SYSTEM_ADMIN")}>
              System Admin Login
            </button>

            <a
              href="http://127.0.0.1:8000/admin/"
              target="_blank"
              rel="noreferrer"
              style={linkButtonStyle}
            >
              Open Django Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  padding: "40px",
  fontFamily: "Arial, sans-serif",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "20px",
  marginTop: "25px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "22px",
  background: "#f9f9f9",
};

const buttonGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const linkButtonStyle = {
  display: "inline-block",
  textAlign: "center",
  textDecoration: "none",
  color: "black",
  border: "1px solid #999",
  borderRadius: "4px",
  padding: "8px 12px",
  background: "#eee",
};

export default HomePage;