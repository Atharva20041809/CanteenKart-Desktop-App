// API base configuration
const API_BASE_URL = 'http://localhost:5001/api';

// Helper to retrieve token from localStorage
export function getAuthToken() {
  return localStorage.getItem('canteenkart_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('canteenkart_token', token);
  } else {
    localStorage.removeItem('canteenkart_token');
  }
}

export function getAdminUser() {
  const user = localStorage.getItem('canteenkart_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setAdminUser(user) {
  if (user) {
    localStorage.setItem('canteenkart_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('canteenkart_user');
  }
}

// Request helper
async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
      setAdminUser(null);
      window.dispatchEvent(new Event('auth-logout'));
    }
    const err = new Error(data.message || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Auth
  login: (username, password) => request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),

  // Orders
  getAdminOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    const qs = query.toString();
    return request(`/admin/orders${qs ? `?${qs}` : ''}`);
  },

  updateOrderStatus: (id, status) => request(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Menu
  getAdminMenu: () => request('/admin/menu'),
  createMenuItem: (item) => request('/admin/menu', {
    method: 'POST',
    body: JSON.stringify(item)
  }),
  updateMenuItem: (id, item) => request(`/admin/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  }),
  deleteMenuItem: (id) => request(`/admin/menu/${id}`, {
    method: 'DELETE'
  }),

  // Stats
  getStats: () => request('/admin/stats')
};
