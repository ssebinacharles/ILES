import apiRequest from "./apiClient";

export function loginUser(data) {
  return apiRequest("/users/auth/login/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function registerUser(data) {
  return apiRequest("/users/auth/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
