import apiRequest from "./apiClient";

export function getSupervisorAssignments() {
  return apiRequest("/issues/supervisor-assignments/");
}

export function getSupervisorAssignment(id) {
  return apiRequest(`/issues/supervisor-assignments/${id}/`);
}

export function createSupervisorAssignment(data) {
  return apiRequest("/issues/supervisor-assignments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateSupervisorAssignment(id, data) {
  return apiRequest(`/issues/supervisor-assignments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function patchSupervisorAssignment(id, data) {
  return apiRequest(`/issues/supervisor-assignments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteSupervisorAssignment(id) {
  return apiRequest(`/issues/supervisor-assignments/${id}/`, {
    method: "DELETE",
  });
}