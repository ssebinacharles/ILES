import apiRequest from "./apiClient";

const SUPERVISOR_ASSIGNMENTS_ENDPOINT = "/issues/supervisor-assignments/";

export function getSupervisorAssignments() {
  return apiRequest(SUPERVISOR_ASSIGNMENTS_ENDPOINT);
}

export function getSupervisorAssignment(id) {
  return apiRequest(`${SUPERVISOR_ASSIGNMENTS_ENDPOINT}${id}/`);
}

export function createSupervisorAssignment(data) {
  const payload = {
    placement_id: Number(data.placement_id),
    supervisor_id: Number(data.supervisor_id),
    assignment_role: data.assignment_role,
    assigned_by_id: data.assigned_by_id || null,
    is_active: data.is_active ?? true,
  };

  return apiRequest(SUPERVISOR_ASSIGNMENTS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSupervisorAssignment(id, data) {
  const payload = {
    placement_id: Number(data.placement_id || data.placement?.id),
    supervisor_id: Number(data.supervisor_id || data.supervisor?.id),
    assignment_role: data.assignment_role,
    assigned_by_id: data.assigned_by_id || data.assigned_by?.id || null,
    is_active: data.is_active ?? true,
  };

  return apiRequest(`${SUPERVISOR_ASSIGNMENTS_ENDPOINT}${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function patchSupervisorAssignment(id, data) {
  return apiRequest(`${SUPERVISOR_ASSIGNMENTS_ENDPOINT}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteSupervisorAssignment(id) {
  return apiRequest(`${SUPERVISOR_ASSIGNMENTS_ENDPOINT}${id}/`, {
    method: "DELETE",
  });
}