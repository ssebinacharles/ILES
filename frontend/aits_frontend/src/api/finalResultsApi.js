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

export function patchFinalResult(id, data) {
  return apiRequest(`/issues/final-results/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteFinalResult(id) {
  return apiRequest(`/issues/final-results/${id}/`, {
    method: "DELETE",
  });
}

export function getMyFinalResult() {
  return apiRequest("/issues/final-results/my-results/");
}

export function getStudentFinalResult(studentId) {
  return apiRequest(`/issues/final-results/student/${studentId}/result/`);
}