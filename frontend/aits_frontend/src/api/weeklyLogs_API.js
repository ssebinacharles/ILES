import apiClient from "./axios";
/**
 * Retrieves weekly logs for a specific placement.
 */
export const fetchWeeklyLogs = async (placementId) => {
  const response = await apiClient.get(`/weekly-logs/?placement_id=${placementId}`);
  return response.data;
};
/**
 * Creates a new weekly log for a placement.
 */
export const createWeeklyLog = async (placementId, data) => {
  const response = await apiClient.post(`/weekly-logs/?placement_id=${placementId}`, data);
  return response.data;
};
/**
 * Updates an existing weekly log identified by logId.
 */
export const updateWeeklyLog = async (logId, data) => {
  const response = await apiClient.patch(`/weekly-logs/${logId}/`, data);
  return response.data;
};
