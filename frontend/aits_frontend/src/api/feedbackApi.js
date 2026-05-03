import apiRequest from "./apiClient";

const FEEDBACK_ENDPOINT = "/issues/feedback/";

export function getFeedback() {
  return apiRequest(FEEDBACK_ENDPOINT);
}

export function getFeedbackEntry(id) {
  return apiRequest(`${FEEDBACK_ENDPOINT}${id}/`);
}

export function createFeedback(data) {
  const payload = {
    weekly_log_id: data.weekly_log_id,
    decision: data.decision || "COMMENT",
    comment: data.comment || "",
    score:
      data.score === "" || data.score === undefined || data.score === null
        ? null
        : Number(data.score),
    is_latest: data.is_latest ?? true,
  };

  return apiRequest(FEEDBACK_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFeedback(id, data) {
  return apiRequest(`${FEEDBACK_ENDPOINT}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function patchFeedback(id, data) {
  return apiRequest(`${FEEDBACK_ENDPOINT}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteFeedback(id) {
  return apiRequest(`${FEEDBACK_ENDPOINT}${id}/`, {
    method: "DELETE",
  });
}