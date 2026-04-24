import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { username } = formData;

    // Demo role logic – replace with real authentication.
    let userRole = null;
    if (username === "student") userRole = "STUDENT";
    else if (username === "supervisor") userRole = "SUPERVISOR";
    else if (username === "admin") userRole = "ADMINISTRATOR";

    if (userRole) {
      // Set dummy user and navigate.
      login({ username, role: userRole });
      if (userRole === "STUDENT") navigate("/student/dashboard");
      else if (userRole === "SUPERVISOR") navigate("/supervisor/dashboard");
      else if (userRole === "ADMINISTRATOR") navigate("/admin/dashboard");
    } else {
      alert("Invalid user. Try student, supervisor, or admin.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>ILES Login</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: "350px" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Username:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Log In
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
