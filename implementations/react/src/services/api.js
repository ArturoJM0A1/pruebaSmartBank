/**
 * API Service - Axios Configuration
 * 
 * AXIOS vs FETCH API:
 * 
 * 1. Fetch (built-in):
 *    - Promise-based, no extra dependencies
 *    - Requires manual error checking (!response.ok)
 *    - No automatic JSON parsing
 *    - No request/response interceptors
 *    - No timeout by default
 * 
 * 2. Axios:
 *    - Automatic JSON transformation
 *    - Interceptors for request/response transformation
 *    - Built-in timeout and cancelation
 *    - Better error messages
 *    - Browser and Node.js support
 * 
 * INTERCEPTORS pattern:
 * - Request interceptor: Attach auth token, log requests
 * - Response interceptor: Handle errors, transform data
 * - Like middleware for HTTP requests
 * 
 * WHY centralized API service?
 * - Single point of configuration (base URL, headers, timeout)
 * - Consistent error handling across the app
 * - Easy to swap backend or add caching
 * - Testable: mock one module instead of all API calls
 */
import axios from 'axios';

// Create axios instance with defaults
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000, // WHY 10 seconds? Balance between user patience and server response
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
// WHY attach token here instead of in each request?
// - DRY principle: one place to maintain auth logic
// - Automatic: every request gets the token
// - Centralized: easy to update token refresh logic
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // WHY log in dev only?
    // Production logging should use proper monitoring tools
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
// WHY handle 401 globally?
// - Token expiration affects all endpoints
// - Avoids repeating auth check in every API call
// - Centralized redirect to login
api.interceptors.response.use(
  (response) => {
    // WHY pass through response.data?
    // Most consumers only need the data, not the full axios response
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // WHY window.location instead of React Router?
      // Interceptors run outside React component tree
      // Can't use hooks or React Router's navigate here
      window.location.href = '/login';
    }
    
    // WHY rethrow with enhanced error?
    // Provides consistent error format for consumers
    return Promise.reject(error);
  }
);

// API endpoint functions
// WHY separate functions instead of raw axios calls?
// - Type safety (with TypeScript)
// - Single source of truth for endpoints
// - Easy to find and update API calls
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
};

export const accountsApi = {
  getAll: () => api.get('/accounts'),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
};

export const transactionsApi = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  createTransfer: (data) => api.post('/transfers', data),
};
