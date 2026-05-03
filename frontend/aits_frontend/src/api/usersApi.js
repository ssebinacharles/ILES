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

export function patchUser(id, data) {
  return apiRequest(`${USERS_ENDPOINT}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getStudents() {
  return apiRequest(STUDENTS_ENDPOINT);
}

export function getStudent(id) {
  return apiRequest(`${STUDENTS_ENDPOINT}${id}/`);
}

export function getSupervisors() {
  return apiRequest(SUPERVISORS_ENDPOINT);
}

export function getSupervisor(id) {
  return apiRequest(`${SUPERVISORS_ENDPOINT}${id}/`);
}

export function getAdministrators() {
  return apiRequest(ADMINISTRATORS_ENDPOINT);
}

export function getAdministrator(id) {
  return apiRequest(`${ADMINISTRATORS_ENDPOINT}${id}/`);
}