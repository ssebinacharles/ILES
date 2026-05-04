import { useState } from "react";

import { loginUser } from "../api/authApi";

function LoginPage({ loginRole, supervisorType, onLoginSuccess, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await loginUser({
        username,
        password,
        role: loginRole,
        supervisor_type: supervisorType,
      });

      localStorage.setItem("iles_user", JSON.stringify(response.user));
      onLoginSuccess(response.user);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function getLoginDetails() {
    if (loginRole === "STUDENT") {
      return {
        title: "Student Login",
        badge: "Student Portal",
        icon: "🎓",
        roleName: "Student",
        subtitle:
          "Access your internship placement, weekly logs, supervisor feedback, evaluations, and final results.",
      };
    }

    if (loginRole === "SUPERVISOR" && supervisorType === "ACADEMIC") {
      return {
        title: "Academic Supervisor Login",
        badge: "Academic Review Portal",
        icon: "📘",
        roleName: "Academic Supervisor",
        subtitle:
          "Review assigned students, assess weekly logs, provide academic feedback, and monitor internship progress.",
      };
    }

    if (loginRole === "SUPERVISOR" && supervisorType === "WORKPLACE") {
      return {
        title: "Workplace Supervisor Login",
        badge: "Workplace Review Portal",
        icon: "🏢",
        roleName: "Workplace Supervisor",
        subtitle:
          "Review intern weekly logs, provide workplace feedback, and support internship assessment.",
      };
    }

    if (loginRole === "ADMINISTRATOR") {
      return {
        title: "Internship Administrator Login",
        badge: "Administrator Portal",
        icon: "🛡️",
        roleName: "Internship Administrator",
        subtitle:
          "Manage placement requests, users, supervisor assignments, assessments, reports, and final results.",
      };
    }

    return {
      title: "System Admin Login",
      badge: "System Access",
      icon: "⚙️",
      roleName: "System Admin",
      subtitle:
        "Access system-level administration tools for managing ILES records and configurations.",
    };
  }

  const loginDetails = getLoginDetails();

  return (
    <div className="iles-login-page">
      <div className="iles-login-background-shape shape-one"></div>
      <div className="iles-login-background-shape shape-two"></div>

      <main className="iles-login-shell">
        <section className="iles-login-info">
          <div className="iles-login-brand">
            <span className="iles-brand-mark">ILES</span>
            <span>Internship Logging & Evaluation System</span>
          </div>

          <div className="iles-login-role-icon">{loginDetails.icon}</div>

          <h2>{loginDetails.roleName}</h2>

          <p>{loginDetails.subtitle}</p>

          <div className="iles-login-progress">
            <div>
              <strong>01</strong>
              <span>Login</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Access Dashboard</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Manage Internship Work</span>
            </div>
          </div>
        </section>

        <section className="iles-login-card">
          <span className="iles-auth-badge">{loginDetails.badge}</span>

          <h1>{loginDetails.title}</h1>

          <p className="iles-auth-subtitle">
            Enter your username and password to continue.
          </p>

          {error && <p className="iles-auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="iles-login-form">
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="iles-auth-primary-button"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="iles-auth-secondary-button"
            >
              Back
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;