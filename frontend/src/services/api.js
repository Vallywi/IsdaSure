const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export async function apiGetStatus() {
  return request('/status');
}

export async function apiLogin(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiRegister(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUsers() {
  return request('/auth/users');
}

export async function apiContribute(payload) {
  return request('/contribute', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiTriggerStorm(payload) {
  return request('/trigger-storm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}