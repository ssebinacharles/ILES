import apiClient from "./axios";

/**
 * Sends a login request with user credentials.
 * Returns the response data.
 */
export const login = async (credentials) => {
  const response = await apiClient.post("/auth/login/", credentials);
  return response.data;
};

/**
 * Fetches the currently authenticated user.
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get("/auth/me/");
  return response.data;
};

/**
 * Logs out the current user.
 */
export const logout = async () => {
  const response = await apiClient.post("/auth/logout/");
  return response.data;
};
