import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Re-request queue for token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Request interceptor: inject access token
api.interceptors.request.use(
  (config) => {
    // Token is set in store - also check localStorage as fallback
    const stored = localStorage.getItem('auth-store');
    if (stored && !config.headers['Authorization']) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.accessToken) {
          config.headers['Authorization'] = `Bearer ${state.accessToken}`;
        }
      } catch {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dynamic import to avoid circular dependency
        const { default: useAuthStore } = await import('../store/authStore');
        const success = await useAuthStore.getState().refreshAccessToken();

        if (success) {
          const newToken = useAuthStore.getState().accessToken;
          processQueue(null, newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Task API helpers ─────────────────────────────────────────────────────────
export const taskApi = {
  list: (params) => api.get('/tasks', { params }),
  get: (taskId) => api.get(`/tasks/${taskId}`),
  create: (data) => api.post('/tasks', data),
  cancel: (taskId) => api.post(`/tasks/${taskId}/cancel`),
  retry: (taskId) => api.post(`/tasks/${taskId}/retry`),
  getLogs: (taskId, params) => api.get(`/tasks/${taskId}/logs`, { params }),
  getStats: () => api.get('/tasks/stats'),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: (data) => api.post('/auth/refresh', data),
  me: () => api.get('/auth/me'),
};
