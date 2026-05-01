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

export function logoutUser() {
  return apiRequest("/users/auth/logout/", {
    method: "POST",
  });
}

export function getCurrentUser() {
  return apiRequest("/users/auth/me/");
}

export const login = loginUser;
export const register = registerUser;
export const logout = logoutUser;
export const getCurrent = getCurrentUser;