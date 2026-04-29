import { useState } from "react";
import { loginUser } from "../api/authApi";

function getLoginTitle(role, supervisorType) {
  if (role === "STUDENT") return "Student Login";
  if (role === "ADMINISTRATOR") return "Internship Administrator Login";
  if (role === "SYSTEM_ADMIN") return "System Admin Login";

  if (role === "SUPERVISOR" && supervisorType === "ACADEMIC") {
    return "Academic Supervisor Login";
  }

  if (role === "SUPERVISOR" && supervisorType === "WORKPLACE") {
    return "Workplace Supervisor Login";
  }

  return "Login";
}

function LoginPage({ loginRole, supervisorType, onLoginSuccess, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await loginUser({
        username,
        password,
        requestedRole: loginRole,
        supervisorType,
      });

      localStorage.setItem("iles_user", JSON.stringify(response.user));
      onLoginSuccess(response.user);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          ← Back
        </button>

        <h1>{getLoginTitle(loginRole, supervisorType)}</h1>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            Show password
          </label>

          {error && <p style={errorStyle}>{error}</p>}

          <button type="submit" disabled={loading} style={submitButtonStyle}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle = {
  padding: "40px",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  justifyContent: "center",
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "25px",
  background: "#f9f9f9",
};

const backButtonStyle = {
  marginBottom: "15px",
};

const fieldStyle = {
  marginBottom: "15px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const inputStyle = {
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
};

const checkboxStyle = {
  display: "flex",
  gap: "8px",
  marginBottom: "15px",
};

const errorStyle = {
  color: "red",
};

const submitButtonStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #999",
  cursor: "pointer",
};

export default LoginPage;