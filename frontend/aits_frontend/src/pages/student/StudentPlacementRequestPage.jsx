import { useEffect, useState } from "react";

import { getCompanies, createCompany } from "../../api/companiesApi";
import { createPlacement } from "../../api/placementsApi";
import { asArray } from "../../utils/dashboardHelpers";

function StudentPlacementRequestPage() {
  const [companies, setCompanies] = useState([]);

  const [form, setForm] = useState({
    company_name: "",
    location: "",
    contact_email: "",
    contact_phone: "",
    contact_person_name: "",
    org_department: "",
    workplace_supervisor_name: "",
    workplace_supervisor_email: "",
    workplace_supervisor_phone: "",
    workplace_supervisor_title: "",
    workplace_supervisor_department: "",
    start_date: "",
    end_date: "",
    student_notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getCompanies()
      .then((data) => setCompanies(asArray(data)))
      .catch(() => setCompanies([]));
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function getOrCreateCompany() {
    const existing = companies.find(
      (company) =>
        company.company_name.toLowerCase().trim() ===
        form.company_name.toLowerCase().trim()
    );

    if (existing) return existing;

    return createCompany({
      company_name: form.company_name,
      location: form.location,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      contact_person_name: form.contact_person_name,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const company = await getOrCreateCompany();

      await createPlacement({
        company_id: company.id,
        org_department: form.org_department,
        workplace_supervisor_name: form.workplace_supervisor_name,
        workplace_supervisor_email: form.workplace_supervisor_email,
        workplace_supervisor_phone: form.workplace_supervisor_phone,
        workplace_supervisor_title: form.workplace_supervisor_title,
        workplace_supervisor_department: form.workplace_supervisor_department,
        start_date: form.start_date,
        end_date: form.end_date,
        student_notes: form.student_notes,
        status: "PENDING",
      });

      setMessage("Placement details submitted to internship administrator.");
    } catch (err) {
      setError(err.message || "Failed to submit placement details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Submit Internship Placement Details</h1>
      <p>
        Submit your company and workplace supervisor details for administrator approval.
      </p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <h2>Company Details</h2>

        <Input label="Company Name" name="company_name" value={form.company_name} onChange={handleChange} required />
        <Input label="Location" name="location" value={form.location} onChange={handleChange} required />
        <Input label="Company Email" name="contact_email" value={form.contact_email} onChange={handleChange} />
        <Input label="Company Phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} />
        <Input label="Contact Person" name="contact_person_name" value={form.contact_person_name} onChange={handleChange} />

        <h2>Workplace Supervisor Details</h2>

        <Input label="Supervisor Name" name="workplace_supervisor_name" value={form.workplace_supervisor_name} onChange={handleChange} required />
        <Input label="Supervisor Email" name="workplace_supervisor_email" value={form.workplace_supervisor_email} onChange={handleChange} />
        <Input label="Supervisor Phone" name="workplace_supervisor_phone" value={form.workplace_supervisor_phone} onChange={handleChange} />
        <Input label="Supervisor Title" name="workplace_supervisor_title" value={form.workplace_supervisor_title} onChange={handleChange} />
        <Input label="Department in Organization" name="workplace_supervisor_department" value={form.workplace_supervisor_department} onChange={handleChange} />

        <h2>Internship Period</h2>

        <Input label="Organization Department" name="org_department" value={form.org_department} onChange={handleChange} />
        <Input label="Start Date" type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
        <Input label="End Date" type="date" name="end_date" value={form.end_date} onChange={handleChange} required />

        <label>
          Notes
          <textarea
            name="student_notes"
            value={form.student_notes}
            onChange={handleChange}
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Placement Details"}
        </button>
      </form>
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

const formStyle = {
  display: "grid",
  gap: "14px",
  maxWidth: "700px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

export default StudentPlacementRequestPage;