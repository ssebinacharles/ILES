import apiRequest from "./apiClient";

export function getCompanies() {
  return apiRequest("/issues/companies/");
}

export function createCompany(data) {
  return apiRequest("/issues/companies/", {
    method: "POST",
    body: JSON.stringify(data),
  });
};