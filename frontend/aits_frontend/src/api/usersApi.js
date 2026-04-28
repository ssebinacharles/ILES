import apiRequest from "./apiClient";

export function getUsers() {
  return apiRequest("/users/users/");
}

export function getUser(id) {
  return apiRequest(`/users/users/${id}/`);
}

export function createUser(data) {
  return apiRequest("/users/users/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getStudents() {
  return apiRequest("/users/students/");
}

export function getSupervisors() {
  return apiRequest("/users/supervisors/");
}

export function getAdministrators() {
  return apiRequest("/users/administrators/");
}