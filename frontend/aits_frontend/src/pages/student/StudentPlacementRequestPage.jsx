import { useEffect, useState } from "react";

import { getCompanies, createCompany } from "../../api/companiesApi";
import { createPlacement, getPlacements } from "../../api/placementsApi";
import { asArray, formatDateTime } from "../../utils/dashboardHelpers";

function StudentPlacementRequestPage() {
  const [companies, setCompanies] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

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

  function loadPageData() {
    setInitialLoading(true);
    setError("");

    Promise.all([getCompanies(), getPlacements()])
      .then(([companyData, placementData]) => {
        setCompanies(asArray(companyData));
        setPlacements(asArray(placementData));
        setInitialLoading(false);
      })
      .catch((err) => {
        setCompanies([]);
        setPlacements([]);
        setError(err.message || "Failed to load placement request page.");
        setInitialLoading(false);
      });
  }

  useEffect(() => {
    loadPageData();
  }, []);

  const existingActivePlacement = placements.find(
    (placement) => placement.status !== "REJECTED"
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
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
  }

  function validateForm() {
    if (!form.company_name.trim()) {
      return "Please enter the company name.";
    }

    if (!form.location.trim()) {
      return "Please enter the company location.";
    }

    if (!form.workplace_supervisor_name.trim()) {
      return "Please enter the workplace supervisor name.";
    }

    if (!form.start_date) {
      return "Please select the internship start date.";
    }

    if (!form.end_date) {
      return "Please select the internship end date.";
    }

    if (form.start_date >= form.end_date) {
      return "Internship start date must be earlier than the end date.";
    }

    return "";
  }

  async function getOrCreateCompany() {
    const existing = companies.find(
      (company) =>
        company.company_name.toLowerCase().trim() ===
        form.company_name.toLowerCase().trim()
    );

    if (existing) {
      return existing;
    }

    return createCompany({
      company_name: form.company_name.trim(),
      location: form.location.trim(),
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim(),
      contact_person_name: form.contact_person_name.trim(),
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (existingActivePlacement) {
      setError(
        "You already submitted placement details. You can only submit another placement if the internship administrator rejects the previous one."
      );
      setLoading(false);
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const company = await getOrCreateCompany();

      await createPlacement({
        company_id: company.id,
        org_department: form.org_department.trim(),
        workplace_supervisor_name: form.workplace_supervisor_name.trim(),
        workplace_supervisor_email: form.workplace_supervisor_email.trim(),
        workplace_supervisor_phone: form.workplace_supervisor_phone.trim(),
        workplace_supervisor_title: form.workplace_supervisor_title.trim(),
        workplace_supervisor_department:
          form.workplace_supervisor_department.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        student_notes: form.student_notes.trim(),
        status: "PENDING",
      });

      const updatedPlacements = await getPlacements();
      setPlacements(asArray(updatedPlacements));

      resetForm();
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
        Submit your company and workplace supervisor details for administrator
        approval.
      </p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {initialLoading && <p>Loading placement request page...</p>}

      {!initialLoading && existingActivePlacement ? (
        <div style={boxStyle}>
          <h2>Placement Request Already Submitted</h2>

          <p>
            You already have a placement request or placement in the system. You
            can only submit another placement if the internship administrator
            rejects the previous one.
          </p>

          <p>
            <strong>Company:</strong>{" "}
            {existingActivePlacement.company?.company_name || "-"}
          </p>

          <p>
            <strong>Status:</strong> {existingActivePlacement.status || "-"}
          </p>

          <p>
            <strong>Submitted At:</strong>{" "}
            {existingActivePlacement.requested_at
              ? formatDateTime(existingActivePlacement.requested_at)
              : "-"}
          </p>

          <p>
            <strong>Internship Period:</strong>{" "}
            {existingActivePlacement.start_date || "-"} to{" "}
            {existingActivePlacement.end_date || "-"}
          </p>

          <p>
            <strong>Workplace Supervisor:</strong>{" "}
            {existingActivePlacement.workplace_supervisor_name ||
              "Not yet confirmed"}
          </p>

          <p>
            <strong>Workplace Supervisor Email:</strong>{" "}
            {existingActivePlacement.workplace_supervisor_email || "-"}
          </p>

          <p>
            <strong>Student Notes:</strong>{" "}
            {existingActivePlacement.student_notes || "-"}
          </p>
        </div>
      ) : (
        !initialLoading && (
          <form onSubmit={handleSubmit} style={formStyle}>
            <h2>Company Details</h2>

            <Input
              label="Company Name"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              required
            />

            <Input
              label="Location"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
            />

            <Input
              label="Company Email"
              name="contact_email"
              type="email"
              value={form.contact_email}
              onChange={handleChange}
            />

            <Input
              label="Company Phone"
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleChange}
            />

            <Input
              label="Contact Person"
              name="contact_person_name"
              value={form.contact_person_name}
              onChange={handleChange}
            />

            <h2>Workplace Supervisor Details</h2>

            <Input
              label="Supervisor Name"
              name="workplace_supervisor_name"
              value={form.workplace_supervisor_name}
              onChange={handleChange}
              required
            />

            <Input
              label="Supervisor Email"
              name="workplace_supervisor_email"
              type="email"
              value={form.workplace_supervisor_email}
              onChange={handleChange}
            />

            <Input
              label="Supervisor Phone"
              name="workplace_supervisor_phone"
              value={form.workplace_supervisor_phone}
              onChange={handleChange}
            />

            <Input
              label="Supervisor Title"
              name="workplace_supervisor_title"
              value={form.workplace_supervisor_title}
              onChange={handleChange}
            />

            <Input
              label="Department in Organization"
              name="workplace_supervisor_department"
              value={form.workplace_supervisor_department}
              onChange={handleChange}
            />

            <h2>Internship Period</h2>

            <Input
              label="Organization Department"
              name="org_department"
              value={form.org_department}
              onChange={handleChange}
            />

            <Input
              label="Start Date"
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
            />

            <Input
              label="End Date"
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              required
            />

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
        )
      )}
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

const boxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "18px",
  marginTop: "20px",
  background: "#fff",
};

export default StudentPlacementRequestPage;