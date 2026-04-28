import apiRequest from "./apiClient";

export function getFinalResults() {
  return apiRequest("/issues/final-results/");
}

export function getFinalResult(id) {
  return apiRequest(`/issues/final-results/${id}/`);
}

export function createFinalResult(data) {
  return apiRequest("/issues/final-results/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateFinalResult(id, data) {
  return apiRequest(`/issues/final-results/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function publishFinalResult(id) {
  return apiRequest(`/issues/final-results/${id}/publish/`, {
    method: "POST",
  });
}

export function deleteFinalResult(id) {
  return apiRequest(`/issues/final-results/${id}/`, {
    method: "DELETE",
  });
}