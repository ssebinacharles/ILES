import apiRequest from "./apiClient";

const FEEDBACK_ENDPOINT = "/issues/feedback/";

export function getFeedback() {
  return apiRequest(FEEDBACK_ENDPOINT);
}

export function getFeedbackEntry(id) {
  return apiRequest(`${FEEDBACK_ENDPOINT}${id}/`);
}
