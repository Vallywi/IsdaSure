const isLocalHost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

const API_URL = import.meta.env.VITE_API_URL || (isLocalHost ? '/api' : import.meta.env.PROD ? '/_/backend/api' : '/api');

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
  const url = `${API_URL}${path}`;

  // attempt request once
  const doFetch = async (targetUrl) => {
    const response = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    // try to parse JSON safely
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    try {
      console.debug('API request', { url: targetUrl, options, status: response.status, data });
    } catch (e) {}

    if (!response.ok || data.success === false) {
      const messageParts = [safeMessage(data.message, `Request failed (status ${response.status})`)];
      if (data && typeof data === 'object') {
        try {
          messageParts.push(JSON.stringify(data).slice(0, 240));
        } catch {}
      }
      const err = new Error(messageParts.join(' - '));
      try {
        console.error('API error', { url: targetUrl, status: response.status, data });
      } catch (e) {}
      throw err;
    }

    return data;
  };

  // Primary attempt
  try {
    return await doFetch(url);
  } catch (firstErr) {
    // If running in production and initial host path fails, attempt a simple alternate path
    try {
      const alt = url.replace('/_/backend/api', '/api');
      if (alt !== url) {
        console.warn('Primary API path failed, trying fallback:', alt);
        return await doFetch(alt);
      }
    } catch (secondErr) {
      // fall through to rethrow the original error for clearer root cause
    }
    throw firstErr;
  }
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

export async function apiApproveGroupJoin(payload) {
  return request('/groups/approve', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiRejectGroupJoin(payload) {
  return request('/groups/reject', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}