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
    // Preferred: backend submit endpoint sets submitted_at using Django timezone.now()
    return await apiRequest(`/issues/weekly-logs/${id}/submit/`, {
      method: "POST",
    });
  } catch (error) {
    // Fallback: backend model save() should still set submitted_at when status becomes SUBMITTED
    return apiRequest(`/issues/weekly-logs/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "SUBMITTED",
      }),
    });
  }
}

export function getMyWeeklyLogEvaluations() {
  return apiRequest("/issues/weekly-logs/my-evaluations/");
}

export function getStudentWeeklyLogEvaluations(studentId) {
  return apiRequest(`/issues/weekly-logs/student/${studentId}/evaluations/`);
}