import apiRequest from "./apiClient";

const WEEKLY_LOGS_ENDPOINT = "/issues/weekly-logs/";

export function getWeeklyLogs() {
  return apiRequest(WEEKLY_LOGS_ENDPOINT);
}

export function getWeeklyLog(id) {
  return apiRequest(`${WEEKLY_LOGS_ENDPOINT}${id}/`);
}

export function createWeeklyLog(data) {
  const payload = {
    placement_id: Number(data.placement_id),
    week_number: Number(data.week_number),
    title: data.title || "",
    activities: data.activities || "",
    monday_activities: data.monday_activities || "",
    tuesday_activities: data.tuesday_activities || "",
    wednesday_activities: data.wednesday_activities || "",
    thursday_activities: data.thursday_activities || "",
    friday_activities: data.friday_activities || "",
    challenges: data.challenges || "",
    lessons_learned: data.lessons_learned || "",
    status: data.status || "DRAFT",
  };

  return apiRequest(WEEKLY_LOGS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

