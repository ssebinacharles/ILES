const API_BASE_URL = "http://127.0.0.1:8000/api";

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (let cookie of cookies) {
    cookie = cookie.trim();

    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }

  return null;
}

export async function apiRequest(endpoint, options = {}) {
  const method = options.method || "GET";

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    const csrfToken = getCookie("csrftoken");

    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    method,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export default apiRequest;