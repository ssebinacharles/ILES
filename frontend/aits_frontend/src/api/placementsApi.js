import apiRequest from "./apiClient";

export function getPlacements() {
  return apiRequest("/issues/placements/");
}

export function getPlacement(id) {
  return apiRequest(`/issues/placements/${id}/`);
}

export function createPlacement(data) {
  return apiRequest("/issues/placements/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePlacement(id, data) {
  return apiRequest(`/issues/placements/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function patchPlacement(id, data) {
  return apiRequest(`/issues/placements/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deletePlacement(id) {
  return apiRequest(`/issues/placements/${id}/`, {
    method: "DELETE",
  });
}