import { useState } from "react";

import { registerUser } from "../api/authApi";

function RegisterPage({
  registerRole,
  registerSupervisorType,
  onRegisterSuccess,
  onBack,
}) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",

    registration_number: "",
    course: "",
    year_of_study: "",
    department: "",

    organization_name: "",
    title: "",

    office_name: "Internship Office",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function getTitle() {
    if (registerRole === "STUDENT") return "Create Student Account";

    if (
      registerRole === "SUPERVISOR" &&
      registerSupervisorType === "ACADEMIC"
    ) {
      return "Create Academic Supervisor Account";
    }

    if (
      registerRole === "SUPERVISOR" &&
      registerSupervisorType === "WORKPLACE"
    ) {
      return "Create Workplace Supervisor Account";
    }

    if (registerRole === "ADMINISTRATOR") {
      return "Create Internship Administrator Account";
    }

    return "Create Account";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        role: registerRole,
      };

      if (registerRole === "STUDENT") {
        payload.registration_number = form.registration_number;
        payload.course = form.course;
        payload.year_of_study = Number(form.year_of_study);
        payload.department = form.department;
      }

      if (registerRole === "SUPERVISOR") {
        payload.supervisor_type = registerSupervisorType;
        payload.organization_name = form.organization_name;
        payload.title = form.title;
      }

      if (registerRole === "ADMINISTRATOR") {
        payload.office_name = form.office_name;
      }

      const response = await registerUser(payload);

      localStorage.setItem("iles_user", JSON.stringify(response.user));
      onRegisterSuccess(response.user);
    } catch (err) {
      setError(err.message || "Account creation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1>{getTitle()}</h1>

        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <Input
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
          />

          <Input
            label="Last Name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
          />

          <Input
            label="Phone Number"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
          />

          {registerRole === "STUDENT" && (
            <>
              <Input
                label="Registration Number"
                name="registration_number"
                value={form.registration_number}
                onChange={handleChange}
                required
              />

              <Input
                label="Course"
                name="course"
                value={form.course}
                onChange={handleChange}
                required
              />

              <Input
                label="Year of Study"
                name="year_of_study"
                type="number"
                min="1"
                max="10"
                value={form.year_of_study}
                onChange={handleChange}
                required
              />

              <Input
                label="Department"
                name="department"
                value={form.department}
                onChange={handleChange}
                required
              />
            </>
          )}

          {registerRole === "SUPERVISOR" && (
            <>
              <Input
                label="Supervisor Type"
                name="supervisor_type"
                value={registerSupervisorType}
                disabled
              />

              <Input
                label="Organization Name"
                name="organization_name"
                value={form.organization_name}
                onChange={handleChange}
              />

              <Input
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
              />
            </>
          )}

          {registerRole === "ADMINISTRATOR" && (
            <Input
              label="Office Name"
              name="office_name"
              value={form.office_name}
              onChange={handleChange}
            />
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <button type="button" onClick={onBack}>
            Back
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label>
      {label}
      <input {...props} style={inputStyle} />
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f5f5",
  padding: "30px",
};

const cardStyle = {
  width: "460px",
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

export default RegisterPage;