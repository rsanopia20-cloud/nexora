const TOKEN_KEY = 'nexora_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new Error(
      'Cannot reach the server. Make sure the backend is running on port 5000.'
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed (${response.status})`
    );
    error.status = response.status;
    error.errors = data?.errors || [];
    throw error;
  }

  return data;
}
