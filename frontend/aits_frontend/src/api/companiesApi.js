import apiRequest from "./apiClient";

const COMPANIES_ENDPOINT = "/issues/companies/";

export function getCompanies() {
  return apiRequest(COMPANIES_ENDPOINT);
}

export function getCompany(id) {
  return apiRequest(`${COMPANIES_ENDPOINT}${id}/`);
}

export function createCompany(data) {
  const payload = {
    company_name: data.company_name || "",
    location: data.location || "",
    contact_email: data.contact_email || "",
    contact_phone: data.contact_phone || "",
    website: data.website || "",
    contact_person_name: data.contact_person_name || "",
  };

  return apiRequest(COMPANIES_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCompany(id, data) {
  const payload = {
    company_name: data.company_name || "",
    location: data.location || "",
    contact_email: data.contact_email || "",
    contact_phone: data.contact_phone || "",
    website: data.website || "",
    contact_person_name: data.contact_person_name || "",
  };

  return apiRequest(`${COMPANIES_ENDPOINT}${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function patchCompany(id, data) {
  return apiRequest(`${COMPANIES_ENDPOINT}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCompany(id) {
  return apiRequest(`${COMPANIES_ENDPOINT}${id}/`, {
    method: "DELETE",
  });
}