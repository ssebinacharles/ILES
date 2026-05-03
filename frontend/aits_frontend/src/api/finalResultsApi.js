import apiRequest from "./apiClient";

const FINAL_RESULTS_ENDPOINT = "/issues/final-results/";

export function getFinalResults() {
  return apiRequest(FINAL_RESULTS_ENDPOINT);
}

export function getFinalResult(id) {
  return apiRequest(`${FINAL_RESULTS_ENDPOINT}${id}/`);
}

export function createFinalResult(data) {
  return apiRequest(FINAL_RESULTS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateFinalResult(id, data) {
  return apiRequest(`${FINAL_RESULTS_ENDPOINT}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function patchFinalResult(id, data) {
  return apiRequest(`${FINAL_RESULTS_ENDPOINT}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteFinalResult(id) {
  return apiRequest(`${FINAL_RESULTS_ENDPOINT}${id}/`, {
    method: "DELETE",
  });
}

export async function getMyFinalResult() {
  try {
    const result = await apiRequest(`${FINAL_RESULTS_ENDPOINT}my-results/`);
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    if (
      error.message.includes("No internship placement found") ||
      error.message.includes("not found")
    ) {
      return [];
    }

    throw error;
  }
}

export async function getStudentFinalResult(studentId) {
  try {
    const result = await apiRequest(
      `${FINAL_RESULTS_ENDPOINT}student/${studentId}/result/`
    );

    return Array.isArray(result) ? result : [result];
  } catch (error) {
    if (
      error.message.includes("No internship placement found") ||
      error.message.includes("not found")
    ) {
      return [];
    }

    throw error;
  }
}