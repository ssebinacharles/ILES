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

export function approvePlacement(id) {
  return apiRequest(`/issues/placements/${id}/approve/`, {
    method: "POST",
  });
}

export function rejectPlacement(id, rejectionReason) {
  return apiRequest(`/issues/placements/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({
      rejection_reason: rejectionReason,
    }),
  });
}

export function markPlacementInProgress(id) {
  return apiRequest(`/issues/placements/${id}/mark_in_progress/`, {
    method: "POST",
  });
}

export function completePlacement(id) {
  return apiRequest(`/issues/placements/${id}/complete/`, {
    method: "POST",
  });
}