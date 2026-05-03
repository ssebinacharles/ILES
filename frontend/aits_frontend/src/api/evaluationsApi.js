import apiRequest from "./apiClient";

const EVALUATIONS_ENDPOINT = "/issues/evaluations/";

export function getEvaluations() {
  return apiRequest(EVALUATIONS_ENDPOINT);
}

export function getEvaluation(id) {
  return apiRequest(`${EVALUATIONS_ENDPOINT}${id}/`);
}

export function createEvaluation(data) {
  const payload = {
    placement_id: Number(data.placement_id || data.placement?.id),
    evaluator_id: data.evaluator_id || data.evaluator?.id || undefined,
    evaluation_type: data.evaluation_type,
    total_score: data.total_score,
    weighted_score: data.weighted_score,
    remarks: data.remarks || "",
    status: data.status || "DRAFT",
  };

  return apiRequest(EVALUATIONS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEvaluation(id, data) {
  const payload = {
    placement_id: Number(data.placement_id || data.placement?.id),
    evaluator_id: data.evaluator_id || data.evaluator?.id || undefined,
    evaluation_type: data.evaluation_type,
    total_score: data.total_score,
    weighted_score: data.weighted_score,
    remarks: data.remarks || "",
    status: data.status || "DRAFT",
  };

  return apiRequest(`${EVALUATIONS_ENDPOINT}${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function patchEvaluation(id, data) {
  return apiRequest(`${EVALUATIONS_ENDPOINT}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function submitEvaluation(id) {
  return apiRequest(`${EVALUATIONS_ENDPOINT}${id}/submit/`, {
    method: "POST",
  });
}

export function deleteEvaluation(id) {
  return apiRequest(`${EVALUATIONS_ENDPOINT}${id}/`, {
    method: "DELETE",
  });
}