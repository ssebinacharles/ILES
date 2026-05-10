import apiRequest from "./apiClient";

const USERS_ENDPOINT = "/users/users/";
const STUDENTS_ENDPOINT = "/users/students/";
const SUPERVISORS_ENDPOINT = "/users/supervisors/";
const ADMINISTRATORS_ENDPOINT = "/users/administrators/";

export function getUsers() {
  return apiRequest(USERS_ENDPOINT);
}

export function getUser(id) {
  return apiRequest(`${USERS_ENDPOINT}${id}/`);
}

export function createUser(data) {
  return apiRequest(USERS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(id, data) {
  return apiRequest(`${USERS_ENDPOINT}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
