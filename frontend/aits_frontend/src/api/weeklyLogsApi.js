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

export function patchWeeklyLog(id, data) {
  return apiRequest(`/issues/weekly-logs/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteWeeklyLog(id) {
  return apiRequest(`/issues/weekly-logs/${id}/`, {
    method: "DELETE",
  });
}

// Used by StudentDashboard.jsx and StudentsWeeklyLogsPage.jsx
export async function submitWeeklyLog(id) {
  try {
    // If your backend has a custom submit endpoint, this will work.
    return await apiRequest(`/issues/weekly-logs/${id}/submit/`, {
      method: "POST",
    });
  } catch (error) {
    // Fallback: directly update the weekly log status.
    return apiRequest(`/issues/weekly-logs/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "SUBMITTED",
        submitted_at: new Date().toISOString(),
      }),
    });
  }
}