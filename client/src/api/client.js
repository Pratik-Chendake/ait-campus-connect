// API helper client
// In development, defaults to '/api' (proxied by Vite to localhost:5000)
// In production on Vercel, reads VITE_API_URL pointing to the deployed Railway backend
const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = `${API_HOST}/api`;

export const getUploadUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  return `${API_HOST}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('ait_auth_token');
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  upload: (formData) => apiRequest('/upload', { method: 'POST', body: formData }),
};
