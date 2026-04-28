import apiRequest from "./apiClient";

export function getWeeklyLogs() {
  return apiRequest("/issues/weekly-logs/");
}

export function getWeeklyLog(id) {
  return apiRequest(`/issues/weekly-logs/${id}/`);
}

export function createWeeklyLog(data) {
  return apiRequest("/issues/weekly-logs/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateWeeklyLog(id, data) {
  return apiRequest(`/issues/weekly-logs/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function submitWeeklyLog(id) {
  return apiRequest(`/issues/weekly-logs/${id}/submit/`, {
    method: "POST",
  });
}

export function deleteWeeklyLog(id) {
  return apiRequest(`/issues/weekly-logs/${id}/`, {
    method: "DELETE",
  });
}