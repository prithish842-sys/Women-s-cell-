import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
});

const retryableMethods = new Set(['get', 'head', 'options']);
const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      const path = window.location.pathname;
      if (!['/login', '/register'].includes(path) && !path.startsWith('/public')) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    const config = error.config as any;
    const method = String(config?.method || 'get').toLowerCase();
    const status = error.response?.status;
    const retryCount = config?._retryCount || 0;
    const transientStatus = status === 408 || status === 429 || (status >= 500 && status < 600);
    const transientNetwork = !error.response || error.code === 'ECONNABORTED';

    if (config && retryableMethods.has(method) && retryCount < 2 && (transientNetwork || transientStatus)) {
      config._retryCount = retryCount + 1;
      await sleep(Math.min(1600, 400 * 2 ** retryCount));
      return api(config);
    }
    return Promise.reject(error);
  }
);

export const uploadBaseUrl = import.meta.env.VITE_UPLOAD_BASE_URL || '';
export function resolveUploadUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${uploadBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export default api;
