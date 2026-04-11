import axios from 'axios';

const SESSION_STORAGE_CLEAR_PREFIXES = ['itemsListState:', 'transactionsListState:', 'dashboardControlsState:'];
const LOCAL_STORAGE_CLEAR_KEYS = ['token', 'user', 'dashboard:dismissedAlerts'];
const SESSION_EXPIRED_NOTICE_KEY = 'auth:sessionExpiredNotice';

const clearSessionScopedUiState = () => {
  try {
    const keysToRemove = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key && SESSION_STORAGE_CLEAR_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore storage cleanup errors
  }
};

const clearAuthState = () => {
  LOCAL_STORAGE_CLEAR_KEYS.forEach((key) => localStorage.removeItem(key));
  clearSessionScopedUiState();
};

const isInvalidCredentialsResponse = (error) => {
  const status = error?.response?.status;
  if (status !== 401) return false;

  const errorData = error?.response?.data;
  const code = typeof errorData?.code === 'string' ? errorData.code : null;
  const detail = typeof errorData?.detail === 'string' ? errorData.detail : null;
  const detailCode = detail?.match(/^([A-Z0-9_-]+):/)?.[1] ?? null;

  return code === 'INVALID_CREDENTIALS' || detail === 'INVALID_CREDENTIALS' || detailCode === 'INVALID_CREDENTIALS';
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add authentication token to each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to detect expired/invalid sessions and force a fresh login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasStoredToken = !!localStorage.getItem('token');

    if (hasStoredToken && isInvalidCredentialsResponse(error)) {
      clearAuthState();
      sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, '1');
      if (window.location.pathname !== '/') {
        window.location.assign('/');
      }
    }

    return Promise.reject(error);
  }
);

export const registerCompany = async (companyData) => {
  const response = await api.post(
    '/company/register',
    {
      company: {
        name: companyData.companyName,
        email: companyData.companyEmail,
        nif: companyData.companyNif,
      },
      admin_user: {
        name: companyData.adminName,
        username: companyData.adminUsername,
        password: companyData.adminPassword,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export default api;
