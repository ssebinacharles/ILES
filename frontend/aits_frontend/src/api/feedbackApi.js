import apiRequest from "./apiClient";

export function getFeedback() {
  return apiRequest("/issues/feedback/");
}

export function getFeedbackItem(id) {
  return apiRequest(`/issues/feedback/${id}/`);
}

export function createFeedback(data) {
  return apiRequest("/issues/feedback/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateFeedback(id, data) {
  return apiRequest(`/issues/feedback/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteFeedback(id) {
  return apiRequest(`/issues/feedback/${id}/`, {
    method: "DELETE",
  });
}