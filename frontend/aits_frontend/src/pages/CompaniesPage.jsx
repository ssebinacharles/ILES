import ApiListPage from "../components/common/ApiListPage";
import { getCompanies } from "../api/companiesApi";

function CompaniesPage() {
  return (
    <ApiListPage
      title="Companies"
      description="This page displays companies available for internship placement."
      fetchData={getCompanies}
      emptyMessage="No companies found yet."
      renderItem={(company) => (
        <div>
          <h2>{company.company_name}</h2>
          <p>
            <strong>Location:</strong> {company.location || "Not provided"}
          </p>
          <p>
            <strong>Email:</strong> {company.contact_email || "Not provided"}
          </p>
          <p>
            <strong>Phone:</strong> {company.contact_phone || "Not provided"}
          </p>
          <p>
            <strong>Contact Person:</strong>{" "}
            {company.contact_person_name || "Not provided"}
          </p>
        </div>
      )}
    />
  );
}

export default CompaniesPage;