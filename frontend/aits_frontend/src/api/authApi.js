import apiRequest from "./apiClient";

export function loginUser({ username, password, requestedRole, supervisorType }) {
  return apiRequest("/users/auth/login/", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      requested_role: requestedRole,
      supervisor_type: supervisorType || "",
    }),
  });
}

export function logoutUser() {
  return apiRequest("/users/auth/logout/", {
    method: "POST",
  });
}