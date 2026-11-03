import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth
export const login = (credentials) => api.post('/api/auth/login', credentials);
export const getMe = () => api.get('/api/auth/me');

// Labs
export const getLabs = () => api.get('/api/labs');
export const createLab = (data) => api.post('/api/labs', data);
export const updateLab = (id, data) => api.put(`/api/labs/${id}`, data);
export const deleteLab = (id) => api.delete(`/api/labs/${id}`);

// Departments
export const getDepartments = () => api.get('/api/departments');
export const createDepartment = (data) => api.post('/api/departments', data);
export const updateDepartment = (id, data) => api.put(`/api/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/api/departments/${id}`);

// Requests
export const getRequests = () => api.get('/api/requests');
export const createRequest = (data) => api.post('/api/requests', data);
export const updateRequest = (id, data) => api.put(`/api/requests/${id}`, data);
export const deleteRequest = (id) => api.delete(`/api/requests/${id}`);

// Scheduling
export const runFCFS = () => api.post('/api/schedule/fcfs');
export const runBestFit = () => api.post('/api/schedule/best-fit');
export const runORTools = (timeLimit = 10.0) =>
  api.post(`/api/schedule/or-tools?time_limit_seconds=${timeLimit}`);
export const getAlgorithmResults = () => api.get('/api/schedule/results');
export const clearAllocations = () => api.delete('/api/schedule/clear');

// Rescheduling
export const simulateReschedule = (payload) => api.post('/api/reschedule/simulate', payload);
export const commitReschedule = (payload) => api.post('/api/reschedule/commit', payload);

// Analytics
export const getDashboardStats = () => api.get('/api/analytics/dashboard');
export const getComparisonStats = () => api.get('/api/analytics/comparison');

// Reports
export const getReportsSummary = () => api.get('/api/reports/summary');
export const getExportCsvUrl = (algorithm = 'BEST_FIT') =>
  `${API_BASE_URL}/api/reports/export-csv?algorithm=${algorithm}`;

// Seed / Reset
export const seedDatabase = (force = true) => api.post(`/api/seed?force=${force}`);

export default api;

