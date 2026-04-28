import ApiListPage from "../../components/common/ApiListPage";
import { getPlacements } from "../../api/placementsApi";

function StudentPlacementPage() {
  return (
    <ApiListPage
      title="Internship Placements"
      description="This page displays internship placement records."
      fetchData={getPlacements}
      emptyMessage="No placements found yet."
      renderItem={(placement) => (
        <div>
          <h2>
            {placement.company?.company_name || "Company not shown"}
          </h2>

          <p>
            <strong>Student:</strong>{" "}
            {placement.student?.registration_number || "Not provided"}
          </p>

          <p>
            <strong>Company:</strong>{" "}
            {placement.company?.company_name || "Not provided"}
          </p>

          <p>
            <strong>Department:</strong>{" "}
            {placement.org_department || "Not provided"}
          </p>

          <p>
            <strong>Start Date:</strong> {placement.start_date}
          </p>

          <p>
            <strong>End Date:</strong> {placement.end_date}
          </p>

          <p>
            <strong>Status:</strong> {placement.status}
          </p>

          {placement.rejection_reason && (
            <p>
              <strong>Rejection Reason:</strong>{" "}
              {placement.rejection_reason}
            </p>
          )}
        </div>
      )}
    />
  );
}

export default StudentPlacementPage;