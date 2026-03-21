import axios from 'axios';

const BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
).replace(/\/+$/, '');

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-Token',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-Token',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAuthRole = () => {
  if (globalThis.sessionStorage === undefined) return null;
  return globalThis.sessionStorage.getItem('auth_role');
};

export const setAuthToken = (
  token?: string | null,
  role?: 'seller' | 'customer' | 'admin' | 'courier' | null,
) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    if (globalThis.sessionStorage !== undefined) {
      globalThis.sessionStorage.setItem('auth_jwt', token);
      if (role) {
        globalThis.sessionStorage.setItem('auth_role', role);
      }
    }
    return;
  }

  delete api.defaults.headers.common.Authorization;
  if (globalThis.sessionStorage !== undefined) {
    globalThis.sessionStorage.removeItem('auth_jwt');
    globalThis.sessionStorage.removeItem('auth_role');
  }
};

if (globalThis.sessionStorage !== undefined) {
  const existingToken = globalThis.sessionStorage.getItem('auth_jwt');
  if (existingToken) {
    setAuthToken(existingToken);
  }
}
