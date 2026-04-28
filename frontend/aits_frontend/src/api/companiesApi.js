import apiRequest from "./apiClient";

export function getCompanies() {
  return apiRequest("/issues/companies/");
}

export function getCompany(id) {
  return apiRequest(`/issues/companies/${id}/`);
}

export function createCompany(data) {
  return apiRequest("/issues/companies/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCompany(id, data) {
  return apiRequest(`/issues/companies/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCompany(id) {
  return apiRequest(`/issues/companies/${id}/`, {
    method: "DELETE",
  });
}