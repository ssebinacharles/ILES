import apiClient from "./axios";
/**
 * Retrieves all placements for the current user.
 */
export const fetchPlacements = async () => {
  const response = await apiClient.get("/placements/");
  return response.data;
};
/**
 * Creates a new placement with the given data.
 */
export const createPlacement = async (data) => {
  const response = await apiClient.post("/placements/", data);
  return response.data;
};
/**
 * Updates an existing placement identified by ID.
 */
export const updatePlacement = async (placementId, data) => {
  const response = await apiClient.patch(`/placements/${placementId}/`, data);
  return response.data;
};
