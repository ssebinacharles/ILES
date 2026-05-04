const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

function getCookie(name) {
  const cookieString = document.cookie || "";
  const cookies = cookieString.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();

    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }

  return null;
}

function formatFieldName(field) {
  if (field === "non_field_errors") {
    return "";
  }

  return field
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function flattenErrorMessages(data, parentField = "") {
  if (!data) {
    return [];
  }

  if (typeof data === "string") {
    return [data];
  }

  if (Array.isArray(data)) {
    return data.flatMap((item) => flattenErrorMessages(item, parentField));
  }

  if (typeof data === "object") {
    const messages = [];

    Object.entries(data).forEach(([field, value]) => {
      const formattedField = formatFieldName(field);

      const fullField = parentField
        ? `${parentField} ${formattedField}`.trim()
        : formattedField;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string") {
            messages.push(fullField ? `${fullField}: ${item}` : item);
          } else {
            messages.push(...flattenErrorMessages(item, fullField));
          }
        });
      } else if (typeof value === "object" && value !== null) {
        messages.push(...flattenErrorMessages(value, fullField));
      } else {
        messages.push(fullField ? `${fullField}: ${value}` : String(value));
      }
    });

    return messages;
  }

  return [String(data)];
}

function extractErrorMessage(data, status) {
  if (!data) {
    return `API error: ${status}`;
  }

  if (typeof data === "string") {
    return data || `API error: ${status}`;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.error) {
    return data.error;
  }

  if (data.message) {
    return data.message;
  }

  const messages = flattenErrorMessages(data);

  if (messages.length > 0) {
    return messages.join(" ");
  }

  return `API error: ${status}`;
}

async function readResponseData(response) {
  const contentType = response.headers.get("content-type");

  if (response.status === 204) {
    return null;
  }

  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function apiRequest(endpoint, options = {}) {
  const method = options.method || "GET";

  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    const csrfToken = getCookie("csrftoken");

    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error(
      `Cannot connect to the backend server. Make sure the backend is running at ${API_BASE_URL}.`
    );
  }

  const data = await readResponseData(response);

  if (!response.ok) {
    const message = extractErrorMessage(data, response.status);
    throw new Error(message);
  }

  return data;
}

export default apiRequest;