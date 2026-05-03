import apiRequest from "./apiClient";

const PLACEMENTS_ENDPOINT = "/issues/placements/";

export function getPlacements() {
  return apiRequest(PLACEMENTS_ENDPOINT);
}

export function getPlacement(id) {
  return apiRequest(`${PLACEMENTS_ENDPOINT}${id}/`);
}

export function createPlacement(data) {
  const payload = {
    company_id: Number(data.company_id),
    org_department: data.org_department || "",
    workplace_supervisor_name: data.workplace_supervisor_name || "",
    workplace_supervisor_email: data.workplace_supervisor_email || "",
    workplace_supervisor_phone: data.workplace_supervisor_phone || "",
    workplace_supervisor_title: data.workplace_supervisor_title || "",
    workplace_supervisor_department:
      data.workplace_supervisor_department || "",
    start_date: data.start_date,
    end_date: data.end_date,
    student_notes: data.student_notes || "",
    status: data.status || "PENDING",
  };

  return apiRequest(PLACEMENTS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePlacement(id, data) {
  const payload = {
    company_id: Number(data.company_id || data.company?.id),
    org_department: data.org_department || "",
    workplace_supervisor_name: data.workplace_supervisor_name || "",
    workplace_supervisor_email: data.workplace_supervisor_email || "",
    workplace_supervisor_phone: data.workplace_supervisor_phone || "",
    workplace_supervisor_title: data.workplace_supervisor_title || "",
    workplace_supervisor_department:
      data.workplace_supervisor_department || "",
    start_date: data.start_date,
    end_date: data.end_date,
    student_notes: data.student_notes || "",
    status: data.status || "PENDING",
    rejection_reason: data.rejection_reason || "",
  };

  return apiRequest(`${PLACEMENTS_ENDPOINT}${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function patchPlacement(id, data) {
  return apiRequest(`${PLACEMENTS_ENDPOINT}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deletePlacement(id) {
  return apiRequest(`${PLACEMENTS_ENDPOINT}${id}/`, {
    method: "DELETE",
  });
}