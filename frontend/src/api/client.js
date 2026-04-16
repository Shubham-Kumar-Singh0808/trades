import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

let loaderContext = null;
let toastContext = null;

export const setLoaderContext = (context) => {
  loaderContext = context;
};

export const setToastContext = (context) => {
  toastContext = context;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (loaderContext) {
      loaderContext.setIsLoading(true);
    }
    return config;
  },
  (error) => {
    if (loaderContext) {
      loaderContext.setIsLoading(false);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (loaderContext) {
      loaderContext.setIsLoading(false);
    }
    
    // Show success toast for POST, PUT, PATCH, DELETE requests
    if (response.config.method !== 'get' && toastContext) {
      const message = response.data?.message || 'Operation completed successfully';
      toastContext.showToast(message, 'success');
    }
    
    return response;
  },
  (error) => {
    if (loaderContext) {
      loaderContext.setIsLoading(false);
    }
    
    // Allow callers to suppress global error toast for expected failures (e.g. /api/auth/me when logged out)
    const suppressErrorToast = Boolean(error?.config?.suppressErrorToast);

    // Show error toast
    if (!suppressErrorToast && toastContext) {
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      toastContext.showToast(errorMessage, 'error', 4000);
    }
    
    return Promise.reject(error);
  }
);

export default api;
