import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
} from 'axios';
import { env } from '../../config/env';

const BASE_URL = env.apiBaseUrl;

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-Token',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-Token',
  headers: {
    'Content-Type': 'application/json',
  },
});

type ApiErrorPayload = {
  code?: string;
  details?: unknown;
} | null;

type ApiEnvelope<T = unknown> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
  error: ApiErrorPayload;
  timestamp: string;
};

type AuthRole = 'seller' | 'customer' | 'admin' | 'courier';

type SetAuthTokenOptions = {
  persistToken?: boolean;
};

type UnauthorizedEvent = {
  path: string;
  status: number;
};

let unauthorizedHandler: ((event: UnauthorizedEvent) => void) | null = null;

const isApiEnvelope = (value: unknown): value is ApiEnvelope => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.success === 'boolean' &&
    typeof candidate.status === 'number' &&
    typeof candidate.message === 'string' &&
    'data' in candidate &&
    'error' in candidate &&
    typeof candidate.timestamp === 'string'
  );
};

const attachApiEnvelopeInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use((response: AxiosResponse) => {
    if (!isApiEnvelope(response.data)) {
      return response;
    }

    const envelope = response.data;
    response.data = envelope.data;
    return response;
  });
};

const readCookieValue = (name: string) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const target = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(target));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(target.length));
};

const attachXsrfInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    const xsrfToken = readCookieValue('XSRF-TOKEN');
    if (!xsrfToken) {
      return config;
    }

    config.headers.set?.('X-CSRF-Token', xsrfToken);
    return config;
  });
};

const attachUnauthorizedInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const requestUrl = error.config?.url || '';
      const isPublicAuthEndpoint =
        requestUrl.includes('/api/auth/signin') ||
        requestUrl.includes('/api/auth/signup') ||
        requestUrl.includes('/api/auth/sent/login-signup-otp') ||
        requestUrl.includes('/api/auth/logout');

      if (status === 401 && unauthorizedHandler && !isPublicAuthEndpoint) {
        setAuthToken(null);
        unauthorizedHandler({
          path: requestUrl,
          status,
        });
      }

      return Promise.reject(error);
    },
  );
};

attachApiEnvelopeInterceptor(api);
attachApiEnvelopeInterceptor(publicApi);
attachXsrfInterceptor(api);
attachXsrfInterceptor(publicApi);
attachUnauthorizedInterceptor(api);

export const registerUnauthorizedHandler = (
  handler: ((event: UnauthorizedEvent) => void) | null,
) => {
  unauthorizedHandler = handler;
};

export const getAuthRole = () => {
  if (globalThis.sessionStorage === undefined) return null;
  return globalThis.sessionStorage.getItem('auth_role');
};

export const setAuthToken = (
  token?: string | null,
  role?: AuthRole | null,
  options: SetAuthTokenOptions = {},
) => {
  const persistToken = options.persistToken ?? true;

  if (token && persistToken) {
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
    if (role) {
      globalThis.sessionStorage.setItem('auth_role', role);
    } else {
      globalThis.sessionStorage.removeItem('auth_role');
    }
  }
};

if (globalThis.sessionStorage !== undefined) {
  const existingToken = globalThis.sessionStorage.getItem('auth_jwt');
  const existingRole = getAuthRole() as AuthRole | null;
  if (existingToken) {
    setAuthToken(existingToken, existingRole);
  }
}
