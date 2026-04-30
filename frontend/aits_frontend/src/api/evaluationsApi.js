import apiRequest from "./apiClient";

export function getEvaluations() {
  return apiRequest("/issues/evaluations/");
}

export function getEvaluation(id) {
  return apiRequest(`/issues/evaluations/${id}/`);
}

export function createEvaluation(data) {
  return apiRequest("/issues/evaluations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEvaluation(id, data) {
  return apiRequest(`/issues/evaluations/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function patchEvaluation(id, data) {
  return apiRequest(`/issues/evaluations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteEvaluation(id) {
  return apiRequest(`/issues/evaluations/${id}/`, {
    method: "DELETE",
  });
}