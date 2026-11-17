import axios from 'axios';

// axios setup
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5009/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// req interceptor - add jwt token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//res interceptor - kick to /login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // bad/expired token -> clear storage & redirect
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---
// auth apis
// ---
export const authService = {
  // login
  login: (credentials) => api.post('/auth/login', credentials),
  //fetch current user
  getMe: () => api.get('/auth/me'),
  // logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  //has token?
  isAuthenticated: () => {
    return Boolean(localStorage.getItem('token'));
  },
  // Parse user from localStorage
  getUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }
};

// ----
// emp mgmt (super admin)
// ----
export const employeeService = {
  // get emps w/ search
  getAll: (params = {}) => api.get('/employees', { params }),
  // add emp
  create: (data) => api.post('/employees', data),
  //edit employe
  update: (id, data) => api.put(`/employees/${id}`, data),
  // del employee
  delete: (id) => api.delete(`/employees/${id}`),
  // Toggle emp active/inactive
  updateStatus: (id, status) => api.patch(`/employees/${id}/status`, { status })
};

// --
// settings
// --
export const settingsService = {
  getPreferences: () => api.get('/settings/preferences'),
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

// ---
// customers api
// ---
export const customerService = {
  getAll: (params = {}) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};

// ----
// leads api
// ----
export const leadService = {
  getAll: (params = {}) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`)
};

// ---
// sales
// ---
export const salesService = {
  getAll: () => api.get('/sales'),
  create: (data) => api.post('/sales', data),
  delete: (id) => api.delete(`/sales/${id}`)
};

// ----
// dashbrd & analytics
// ----
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getMonthlySales: () => api.get('/dashboard/monthly-sales'),
  getLeadAnalysis: () => api.get('/dashboard/lead-analysis'),
  getCustomerGrowth: () => api.get('/dashboard/customer-growth'),
  getRecentActivity: () => api.get('/dashboard/recent-activity')
};

// api health ping
export const checkApiHealth = () => api.get('/health');

export default api;
