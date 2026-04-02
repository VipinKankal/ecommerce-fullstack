import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
} from 'axios';
import { env } from '../../appEnv';
import {
  getApiError,
  getDisplayErrorMessage,
} from 'shared/errors/apiError';
import { Product } from 'shared/types/product.types';

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

type ProductListRequestParams = {
  category?: unknown;
  brand?: unknown;
  color?: unknown;
  minPrice?: unknown;
  maxPrice?: unknown;
  minDiscount?: unknown;
  sort?: unknown;
  pageNumber?: unknown;
};

const DEMO_PAGE_SIZE = 12;
const enableMarketplaceDemoFallback =
  process.env.NODE_ENV !== 'production' &&
  process.env.REACT_APP_ENABLE_MARKETPLACE_DEMO_FALLBACK === 'true';

const MARKETPLACE_DEMO_PRODUCTS: Product[] = [
  {
    id: 900001,
    title: 'Handblock Cotton Kurta Set',
    brand: 'Aarohi Weaves',
    description:
      'Soft cotton kurta set with handblock print and comfortable daily fit.',
    mrpPrice: 2499,
    sellingPrice: 1749,
    discountPercent: 30,
    quantity: 38,
    sellerStock: 24,
    warehouseStock: 14,
    color: 'Mustard',
    images: [
      'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=900&auto=format&fit=crop',
    ],
    sizes: 'S,M,L,XL',
    category: { name: 'Women Ethnic', categoryId: 'women-ethnic', level: 2 },
    active: true,
  },
  {
    id: 900002,
    title: 'Classic Linen Blend Shirt',
    brand: 'Northline',
    description:
      'Breathable linen blend shirt with regular collar and office-casual styling.',
    mrpPrice: 1999,
    sellingPrice: 1399,
    discountPercent: 30,
    quantity: 42,
    sellerStock: 26,
    warehouseStock: 16,
    color: 'Sky Blue',
    images: [
      'https://images.unsplash.com/photo-1603251579431-8041402bdeda?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618886614638-80e3c103d31a?q=80&w=900&auto=format&fit=crop',
    ],
    sizes: 'M,L,XL,XXL',
    category: { name: 'Men Shirts', categoryId: 'men-shirts', level: 2 },
    active: true,
  },
  {
    id: 900003,
    title: 'Performance Running Sneakers',
    brand: 'StrideX',
    description:
      'Lightweight running sneakers with cushioned sole for all-day wear.',
    mrpPrice: 4599,
    sellingPrice: 3299,
    discountPercent: 28,
    quantity: 31,
    sellerStock: 19,
    warehouseStock: 12,
    color: 'White',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?q=80&w=900&auto=format&fit=crop',
    ],
    sizes: '6,7,8,9,10',
    category: {
      name: 'Footwear',
      categoryId: 'footwear-sneakers',
      level: 2,
    },
    active: true,
  },
  {
    id: 900004,
    title: 'Relaxed Fit Cargo Joggers',
    brand: 'Streetfound',
    description:
      'Utility-inspired cargo joggers with easy taper and all-day comfort.',
    mrpPrice: 2299,
    sellingPrice: 1599,
    discountPercent: 30,
    quantity: 33,
    sellerStock: 21,
    warehouseStock: 12,
    color: 'Olive',
    images: [
      'https://images.unsplash.com/photo-1514996937319-344454492b37?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506629905607-d9c297d2ec84?q=80&w=900&auto=format&fit=crop',
    ],
    sizes: 'S,M,L,XL',
    category: {
      name: 'Men Bottomwear',
      categoryId: 'men-bottomwear',
      level: 2,
    },
    active: true,
  },
  {
    id: 900005,
    title: 'Embroidered Festive Kurta',
    brand: 'Zariva',
    description:
      'Festive kurta with subtle embroidery and easy straight silhouette.',
    mrpPrice: 2899,
    sellingPrice: 2049,
    discountPercent: 29,
    quantity: 64,
    sellerStock: 40,
    warehouseStock: 24,
    color: 'Wine',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1610030469668-6c0c2c7ea74b?q=80&w=900&auto=format&fit=crop',
    ],
    sizes: 'S,M,L,XL',
    category: { name: 'Women Ethnic', categoryId: 'women-ethnic', level: 2 },
    active: true,
  },
  {
    id: 900006,
    title: 'Oversized Graphic Tee',
    brand: 'Loopline',
    description:
      'Heavy cotton oversized tee with soft hand feel and streetwear print.',
    mrpPrice: 1499,
    sellingPrice: 999,
    discountPercent: 33,
    quantity: 22,
    sellerStock: 13,
    warehouseStock: 9,
    color: 'Off White',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=900&auto=format&fit=crop',
    ],
    sizes: 'M,L,XL',
    category: { name: 'Men Topwear', categoryId: 'men-topwear', level: 2 },
    active: true,
  },
];

const asString = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getUrlPath = (url: string | undefined) => (url || '').split('?')[0];

const isCatalogProductRequest = (url: string | undefined) => {
  const path = getUrlPath(url);
  if (!path) return false;
  if (path.includes('/admin/') || path.includes('/sellers/')) return false;
  return /(?:^|\/)(?:api\/)?products$/.test(path);
};

const isCatalogSearchRequest = (url: string | undefined) => {
  const path = getUrlPath(url);
  if (!path) return false;
  return /(?:^|\/)(?:api\/)?products\/search$/.test(path);
};

const getCatalogProductId = (url: string | undefined): number | null => {
  const path = getUrlPath(url);
  if (!path) return null;

  const match = path.match(/(?:^|\/)(?:api\/)?products\/(\d+)$/);
  if (!match) return null;
  return Number(match[1]);
};

const getRequestParam = (params: unknown, key: string): unknown => {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }

  if (params && typeof params === 'object') {
    return (params as Record<string, unknown>)[key];
  }

  return undefined;
};

const buildDemoProductPage = (rawParams: unknown) => {
  const params = (rawParams || {}) as ProductListRequestParams;
  const category = asString(params.category);
  const brand = asString(params.brand);
  const color = asString(params.color);
  const minPrice = asNumber(params.minPrice);
  const maxPrice = asNumber(params.maxPrice);
  const minDiscount = asNumber(params.minDiscount);
  const sort = asString(params.sort);

  const filtered = MARKETPLACE_DEMO_PRODUCTS.filter((product) => {
    const productCategory = asString(product.category?.categoryId);
    const productBrand = asString(product.brand);
    const productColor = asString(product.color);
    const sellingPrice = Number(product.sellingPrice || 0);
    const discountPercent = Number(product.discountPercent || 0);

    if (category && !productCategory.includes(category)) return false;
    if (brand && !productBrand.includes(brand)) return false;
    if (color && !productColor.includes(color)) return false;
    if (minPrice != null && sellingPrice < minPrice) return false;
    if (maxPrice != null && sellingPrice > maxPrice) return false;
    if (minDiscount != null && discountPercent < minDiscount) return false;
    return true;
  });

  if (sort === 'price_low') {
    filtered.sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));
  } else if (sort === 'price_high') {
    filtered.sort((a, b) => Number(b.sellingPrice) - Number(a.sellingPrice));
  } else if (sort === 'newest') {
    filtered.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }

  const pageNumber = Math.max(0, Number(params.pageNumber || 0));
  const start = pageNumber * DEMO_PAGE_SIZE;

  return {
    content: filtered.slice(start, start + DEMO_PAGE_SIZE),
    totalPages: Math.max(1, Math.ceil(filtered.length / DEMO_PAGE_SIZE)),
    totalElements: filtered.length,
    pageNumber,
    pageSize: DEMO_PAGE_SIZE,
    source: 'MARKETPLACE_DEMO',
  };
};

const searchDemoProducts = (query: unknown) => {
  const normalizedQuery = asString(query);
  return MARKETPLACE_DEMO_PRODUCTS.filter((product) => {
    if (!normalizedQuery) return true;
    const searchable = [
      product.title,
      product.brand,
      product.description,
      product.category?.name,
      product.category?.categoryId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchable.includes(normalizedQuery);
  });
};

const findDemoProductById = (productId: number | null) =>
  productId == null
    ? null
    : MARKETPLACE_DEMO_PRODUCTS.find((product) => product.id === productId) ||
      null;

const hasNonEmptyProductPayload = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload.length > 0;
  }
  if (payload && typeof payload === 'object') {
    const pagePayload = payload as { content?: unknown };
    return Array.isArray(pagePayload.content) && pagePayload.content.length > 0;
  }
  return false;
};

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

const attachErrorNormalizationInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const parsed = getApiError(error, 'Request failed');
      const resolvedMessage = getDisplayErrorMessage(error, 'Request failed');
      const responseData = error.response?.data;

      if (typeof responseData === 'string') {
        if (error.response) {
          error.response.data = resolvedMessage as unknown;
        }
        return Promise.reject(error);
      }

      if (typeof responseData === 'object' && responseData !== null) {
        const dataRecord = responseData as Record<string, unknown>;
        dataRecord.message = resolvedMessage;

        if (typeof dataRecord.error !== 'object' || dataRecord.error === null) {
          dataRecord.error = {};
        }

        const errorPayload = dataRecord.error as Record<string, unknown>;
        if (!errorPayload.errorCode) {
          errorPayload.errorCode = parsed.errorCode;
        }
        if (!errorPayload.code && parsed.code) {
          errorPayload.code = parsed.code;
        }

        if (
          typeof errorPayload.details !== 'object' ||
          errorPayload.details === null
        ) {
          errorPayload.details = {};
        }

        const detailsPayload = errorPayload.details as Record<string, unknown>;
        if (parsed.reasonCode && !detailsPayload.reasonCode) {
          detailsPayload.reasonCode = parsed.reasonCode;
        }
        if (parsed.traceId && !detailsPayload.traceId) {
          detailsPayload.traceId = parsed.traceId;
        }
        if (
          typeof parsed.retryable === 'boolean' &&
          detailsPayload.retryable === undefined
        ) {
          detailsPayload.retryable = parsed.retryable;
        }
      }

      return Promise.reject(error);
    },
  );
};

const buildFallbackResponse = <T>(
  error: AxiosError,
  data: T,
): AxiosResponse<T> | null => {
  if (!error.config) {
    return null;
  }

  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: error.response?.headers || {},
    config: error.config,
    request: error.request,
  };
};

const attachMarketplaceDemoInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (response) => {
      const method = response.config?.method?.toLowerCase();
      if (method !== 'get') return response;

      const requestUrl = response.config?.url;
      if (
        isCatalogProductRequest(requestUrl) &&
        !hasNonEmptyProductPayload(response.data)
      ) {
        response.data = buildDemoProductPage(response.config?.params) as unknown;
        return response;
      }

      if (
        isCatalogSearchRequest(requestUrl) &&
        (!Array.isArray(response.data) || response.data.length === 0)
      ) {
        response.data = searchDemoProducts(
          getRequestParam(response.config?.params, 'query'),
        ) as unknown;
        return response;
      }

      return response;
    },
    (error: AxiosError) => {
      const method = error.config?.method?.toLowerCase();
      if (method !== 'get') {
        return Promise.reject(error);
      }

      const requestUrl = error.config?.url;
      if (isCatalogProductRequest(requestUrl)) {
        const fallbackResponse = buildFallbackResponse(
          error,
          buildDemoProductPage(error.config?.params),
        );
        return fallbackResponse
          ? Promise.resolve(fallbackResponse)
          : Promise.reject(error);
      }

      if (isCatalogSearchRequest(requestUrl)) {
        const fallbackResponse = buildFallbackResponse(
          error,
          searchDemoProducts(getRequestParam(error.config?.params, 'query')),
        );
        return fallbackResponse
          ? Promise.resolve(fallbackResponse)
          : Promise.reject(error);
      }

      const productId = getCatalogProductId(requestUrl);
      const demoProduct = findDemoProductById(productId);
      if (demoProduct) {
        const fallbackResponse = buildFallbackResponse(error, demoProduct);
        return fallbackResponse
          ? Promise.resolve(fallbackResponse)
          : Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
};

attachApiEnvelopeInterceptor(api);
attachApiEnvelopeInterceptor(publicApi);
attachXsrfInterceptor(api);
attachXsrfInterceptor(publicApi);
if (enableMarketplaceDemoFallback) {
  attachMarketplaceDemoInterceptor(publicApi);
}
attachErrorNormalizationInterceptor(api);
attachErrorNormalizationInterceptor(publicApi);
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
