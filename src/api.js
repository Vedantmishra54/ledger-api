const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Calls the backend and unwraps its { success, data | error } format.
async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', { code: 'NETWORK_ERROR' });
  }

  let json = null;
  try { json = await res.json(); } catch { /* response had no JSON body */ }

  if (!res.ok || !json || json.success === false) {
    const e = json && json.error;
    throw new ApiError((e && e.message) || `Request failed (${res.status})`, {
      status: res.status,
      code: e && e.code,
      details: e && e.details,
    });
  }
  return json;
}

export const api = {
  listAccounts: async () => (await request('/accounts')).data,
  createAccount: async (name) => (await request('/accounts', { method: 'POST', body: { name } })).data,
  getBalance: async (id) => (await request(`/accounts/${id}/balance`)).data,
  addTransaction: async (id, payload) =>
    (await request(`/accounts/${id}/transactions`, { method: 'POST', body: payload })).data,
  // returns { data: [...], pagination: {...} }
  listTransactions: async (id, { type, page, limit }) => {
    const params = new URLSearchParams({ page, limit });
    if (type) params.set('type', type);
    return request(`/accounts/${id}/transactions?${params}`);
  },
  createTransfer: async (payload) => (await request('/transfers', { method: 'POST', body: payload })).data,
};