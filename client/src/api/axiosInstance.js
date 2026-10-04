/**
 * api/axiosInstance.js
 *
 * Single Axios instance used by all API modules.
 *
 * Token strategy:
 *  - Access token stored as module-level variable (memory, not localStorage).
 *  - setAccessToken() is called by AuthContext on login/refresh.
 *  - Request interceptor injects it into every request header.
 *  - Response interceptor: on 401, tries /auth/refresh once (with queuing
 *    for concurrent requests), then retries the original request.
 *  - On refresh failure: dispatches 'auth:logout' event so AuthContext
 *    can clear state and redirect to login.
 */

import axios from 'axios'; // kept for axios.create() only

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Module-level token — shared with interceptor without React re-renders
let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Required: sends httpOnly refreshToken cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — inject access token ─────────────────
axiosInstance.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ── Response interceptor — auto-refresh on 401 ───────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Do not intercept or attempt token refresh for auth endpoints
    const isAuthEndpoint =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register') ||
      original?.url?.includes('/auth/refresh');

    // Only intercept 401s on protected endpoints that haven't been retried yet
    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      // Queue concurrent 401s while refresh is in-flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Guard: headers may be undefined on stale config objects
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(original);
          })
          .catch(Promise.reject.bind(Promise));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Use axiosInstance (not bare axios) so the request goes through
        // the Vite proxy and the httpOnly cookie is correctly forwarded.
        // Skip the request interceptor's auth header by using a separate
        // config — refresh endpoint doesn't need an access token.
        const { data } = await axiosInstance.post('/auth/refresh', {});
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        // Notify AuthContext to clear state + redirect
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
