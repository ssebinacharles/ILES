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

  function getTitle() {
    if (loginRole === "STUDENT") return "Student Login";

    if (loginRole === "SUPERVISOR" && supervisorType === "ACADEMIC") {
      return "Academic Supervisor Login";
    }

    if (loginRole === "SUPERVISOR" && supervisorType === "WORKPLACE") {
      return "Workplace Supervisor Login";
    }

    if (loginRole === "ADMINISTRATOR") {
      return "Internship Administrator Login";
    }

    return "System Admin Login";
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1>{getTitle()}</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              style={inputStyle}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <button type="button" onClick={onBack}>
            Back
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f5f5",
};

const cardStyle = {
  width: "420px",
  background: "white",
  padding: "30px",
  borderRadius: "10px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const formStyle = {
  display: "grid",
  gap: "15px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

export default LoginPage;