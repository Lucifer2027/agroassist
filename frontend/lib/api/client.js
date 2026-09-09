/**
 * AgroAssist Pro Centralized API Client
 * Base URL configured via process.env.NEXT_PUBLIC_API_URL
 */

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agroassist-3h4h.onrender.com/api';

/**
 * Gets stored JWT token from localStorage or cookies
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('agroassist_token');
}

/**
 * Sets JWT token in localStorage and cookies for Next.js middleware synchronization
 */
export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('agroassist_token', token);
      document.cookie = `agroassist_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      localStorage.removeItem('agroassist_token');
      document.cookie = 'agroassist_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
}

/**
 * Custom API Error Class
 */
export class ApiClientError extends Error {
  constructor(message, status = 500, code = 'API_ERROR', details = []) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Core fetch wrapper with standard request/response handling
 */
export async function fetchApi(endpoint, options = {}) {
  const token = getAuthToken();
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If 401 Unauthorized, automatically clear expired token and redirect safely to /login
      if (response.status === 401 && typeof window !== 'undefined') {
        setAuthToken(null);
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }

      const errorMessage = data.message || data.error || `HTTP ${response.status} Error`;
      const errorCode = data.code || 'HTTP_ERROR';
      const errorDetails = data.errors || [];
      throw new ApiClientError(errorMessage, response.status, errorCode, errorDetails);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    // Handle network / offline errors
    throw new ApiClientError(
      error.message || 'Unable to connect to AgroAssist API server. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => fetchApi(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => fetchApi(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => fetchApi(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => fetchApi(endpoint, { ...options, method: 'DELETE' }),
};
