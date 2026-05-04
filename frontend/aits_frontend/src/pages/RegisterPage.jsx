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

  function getRegisterDetails() {
    if (registerRole === "STUDENT") {
      return {
        title: "Create Student Account",
        badge: "Student Registration",
        icon: "🎓",
        roleName: "Student Account",
        subtitle:
          "Create your student account to submit placement details, weekly logs, view feedback, evaluations, and final results.",
      };
    }

    if (
      registerRole === "SUPERVISOR" &&
      registerSupervisorType === "ACADEMIC"
    ) {
      return {
        title: "Create Academic Supervisor Account",
        badge: "Academic Supervisor Registration",
        icon: "📘",
        roleName: "Academic Supervisor Account",
        subtitle:
          "Create an academic supervisor account to review assigned students, assess weekly logs, and submit academic feedback.",
      };
    }

    if (
      registerRole === "SUPERVISOR" &&
      registerSupervisorType === "WORKPLACE"
    ) {
      return {
        title: "Create Workplace Supervisor Account",
        badge: "Workplace Supervisor Registration",
        icon: "🏢",
        roleName: "Workplace Supervisor Account",
        subtitle:
          "Create a workplace supervisor account to review interns, assess weekly logs, and provide workplace feedback.",
      };
    }

    if (registerRole === "ADMINISTRATOR") {
      return {
        title: "Create Internship Administrator Account",
        badge: "Administrator Registration",
        icon: "🛡️",
        roleName: "Administrator Account",
        subtitle:
          "Create an administrator account to manage users, placements, supervisor assignments, assessments, and final results.",
      };
    }

    return {
      title: "Create Account",
      badge: "ILES Registration",
      icon: "⚙️",
      roleName: "System Account",
      subtitle:
        "Create an account for the Internship Logging and Evaluation System.",
    };
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

  const registerDetails = getRegisterDetails();

  return (
    <div className="iles-register-page">
      <div className="iles-register-background-shape shape-one"></div>
      <div className="iles-register-background-shape shape-two"></div>

      <main className="iles-register-shell">
        <aside className="iles-register-side-panel">
          <div className="iles-register-brand">
            <span className="iles-brand-mark">ILES</span>
            <span>Internship Logging & Evaluation System</span>
          </div>

          <div className="iles-register-icon">{registerDetails.icon}</div>

          <h2>{registerDetails.roleName}</h2>

          <p>{registerDetails.subtitle}</p>

          <div className="iles-register-steps">
            <div>
              <strong>01</strong>
              <span>Create Account</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Login Automatically</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Access Your Dashboard</span>
            </div>
          </div>
        </aside>

        <section className="iles-register-card">
          <span className="iles-auth-badge">{registerDetails.badge}</span>

          <h1>{registerDetails.title}</h1>

          <p className="iles-auth-subtitle">
            Fill in the details below to create your ILES account.
          </p>

          {error && <p className="iles-auth-error">Error: {error}</p>}

          <form onSubmit={handleSubmit} className="iles-register-form">
            <div className="iles-form-section">
              <h2>Account Details</h2>

              <div className="iles-register-grid">
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
                  label="Phone Number"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="iles-form-section">
              <h2>Personal Details</h2>

              <div className="iles-register-grid">
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
              </div>
            </div>

            {registerRole === "STUDENT" && (
              <div className="iles-form-section">
                <h2>Student Profile</h2>

                <div className="iles-register-grid">
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
                </div>
              </div>
            )}

            {registerRole === "SUPERVISOR" && (
              <div className="iles-form-section">
                <h2>Supervisor Profile</h2>

                <div className="iles-register-grid">
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
                </div>
              </div>
            )}

            {registerRole === "ADMINISTRATOR" && (
              <div className="iles-form-section">
                <h2>Administrator Profile</h2>

                <div className="iles-register-grid">
                  <Input
                    label="Office Name"
                    name="office_name"
                    value={form.office_name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="iles-register-actions">
              <button
                type="submit"
                disabled={loading}
                className="iles-auth-primary-button"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="iles-auth-secondary-button"
              >
                Back
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label>
      {label}
      <input {...props} />
    </label>
  );
}

export default RegisterPage;