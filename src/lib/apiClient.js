const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const ACCESS_TOKEN_KEY = "facelessforge.accessToken";

export async function apiJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...accessHeaders(),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("facelessforge:unauthorized"));
    }
    throw new Error(payload?.detail || payload?.error || `Request failed with status ${response.status}.`);
  }
  return payload;
}

export async function getServerConfig() {
  return apiJson("/api/config", {
    headers: {}
  });
}

export async function verifyAccessToken(token) {
  return apiJson("/api/auth/check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

export function getApiBaseUrl() {
  return API_BASE;
}

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function setAccessToken(token) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function accessHeaders() {
  const token = getAccessToken() || import.meta.env.VITE_APP_ACCESS_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
