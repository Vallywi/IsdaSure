const API_URL = import.meta.env.VITE_API_URL || '/api';

function safeMessage(value, fallback = 'Request failed') {
  try {
    if (typeof value === 'string' && value) {
      return value.slice(0, 240);
    }
    if (value == null) {
      return fallback;
    }
    return String(value).slice(0, 240) || fallback;
  } catch {
    return fallback;
  }
}

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
    throw new Error(safeMessage(data.message, 'Request failed'));
  }

  return data;
}

export async function apiGetStatus() {
  return request('/status');
}

export async function apiGetChainHistory(limit = 30) {
  return request(`/chain/history?limit=${limit}`);
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

export async function apiPrepareContribute(payload) {
  return request('/contribute/prepare', {
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

export async function apiPrepareTriggerStorm(payload) {
  return request('/trigger-storm/prepare', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiListGroups() {
  return request('/groups');
}

export async function apiCreateGroup(payload) {
  return request('/groups/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiJoinGroup(payload) {
  return request('/groups/join', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiMyGroups(payload) {
  return request('/groups/my', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}