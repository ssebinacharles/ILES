import "../styles/homePage.css";

function HomePage({ onChooseLogin, onChooseRegister }) {
  function openDjangoAdmin() {
    window.open("http://127.0.0.1:8000/admin/", "_blank");
  }

  return (
    <div className="home-page">
      <div className="home-overlay">
        <header className="home-header">
          <h1>Internship Logging & Evaluation System</h1>
          <p>
            A role-based platform for managing internship placements, weekly
            logs, supervisor feedback, evaluations, and final results.
          </p>
        </header>

        <div className="home-cards">
          <div className="home-card">
            <div className="home-icon">🎓</div>
            <h2>Student</h2>
            <p>
              Login to view your internship placement, submit weekly logs,
              receive supervisor feedback, and view final results.
            </p>

            <button onClick={() => onChooseLogin("STUDENT")}>
              Student Login
            </button>

            <button
              className="outline-button"
              onClick={() => onChooseRegister("STUDENT")}
            >
              Create Student Account
            </button>
          </div>

          <div className="home-card">
            <div className="home-icon">👨‍🏫</div>
            <h2>Supervisor</h2>
            <p>
              Login as an academic or workplace supervisor to review assigned
              students, weekly logs, feedback, and evaluations.
            </p>

            <button onClick={() => onChooseLogin("SUPERVISOR", "ACADEMIC")}>
              Academic Supervisor Login
            </button>

            <button onClick={() => onChooseLogin("SUPERVISOR", "WORKPLACE")}>
              Workplace Supervisor Login
            </button>

            <button
              className="outline-button"
              onClick={() => onChooseRegister("SUPERVISOR", "ACADEMIC")}
            >
              Create Academic Supervisor Account
            </button>

            <button
              className="outline-button"
              onClick={() => onChooseRegister("SUPERVISOR", "WORKPLACE")}
            >
              Create Workplace Supervisor Account
            </button>
          </div>

          <div className="home-card">
            <div className="home-icon">📋</div>
            <h2>Internship Administrator</h2>
            <p>
              Manage internship placement requests, supervisors, student
              assignments, evaluations, and final results.
            </p>

            <button onClick={() => onChooseLogin("ADMINISTRATOR")}>
              Internship Admin Login
            </button>

            <button
              className="outline-button"
              onClick={() => onChooseRegister("ADMINISTRATOR")}
            >
              Create Internship Admin Account
            </button>
          </div>

          <div className="home-card">
            <div className="home-icon">⚙️</div>
            <h2>System Admin</h2>
            <p>
              Access the Django admin panel for system-level management,
              database records, users, and configurations.
            </p>

            <button onClick={() => onChooseLogin("ADMINISTRATOR")}>
              System Admin Login
            </button>

            <button className="outline-button" onClick={openDjangoAdmin}>
              Open Django Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;