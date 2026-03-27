import {
  type ErrorLocale,
  type ErrorRole,
  resolveErrorMessage,
  type StandardErrorCode,
} from './messageRegistry';

export type AuthRole = ErrorRole;

type ApiErrorShape = {
  response?: {
    status?: number;
    data?:
      | {
          message?: string;
          error?:
            | {
                code?: string;
                details?: unknown;
              }
            | string;
        }
      | string;
  };
  message?: string;
};

export interface ApiRequestError {
  message: string;
  code?: string;
  errorCode: StandardErrorCode;
  reasonCode?: string;
  status?: number;
  details?: Record<string, unknown>;
  traceId?: string;
  retryable?: boolean;
}

const backendCodeToStandard: Record<string, StandardErrorCode> = {
  AUTH_REQUIRED: 'AUTH_ERROR',
  INVALID_CREDENTIALS: 'AUTH_ERROR',
  ACCESS_DENIED: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'BUSINESS_ERROR',
  DUPLICATE_RESOURCE: 'BUSINESS_ERROR',
  RATE_LIMIT_EXCEEDED: 'BUSINESS_ERROR',
  SERVICE_UNAVAILABLE: 'SYSTEM_ERROR',
  INTERNAL_ERROR: 'SYSTEM_ERROR',
};

const asApiError = (error: unknown): ApiErrorShape =>
  typeof error === 'object' && error !== null ? (error as ApiErrorShape) : {};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;

const toDetailsRecord = (
  value: unknown,
): Record<string, unknown> | undefined => {
  const details = asRecord(value);
  return details || undefined;
};

const getReasonCode = (details: unknown): string | undefined => {
  const record = asRecord(details);
  return typeof record?.reasonCode === 'string' ? record.reasonCode : undefined;
};

const inferRoleFromPath = (): AuthRole | null => {
  if (typeof window === 'undefined') return null;
  const pathname = window.location.pathname;
  if (pathname === '/admin/login' || pathname.startsWith('/admin')) {
    return 'admin';
  }
  if (pathname === '/courier/login' || pathname.startsWith('/courier')) {
    return 'courier';
  }
  if (pathname === '/become-seller' || pathname.startsWith('/seller')) {
    return 'seller';
  }
  if (pathname === '/login' || pathname.startsWith('/account')) {
    return 'customer';
  }
  return null;
};

const inferRole = (role?: AuthRole): AuthRole | null => {
  if (role) return role;
  if (globalThis.sessionStorage !== undefined) {
    const sessionRole = globalThis.sessionStorage.getItem('auth_role');
    if (
      sessionRole === 'admin' ||
      sessionRole === 'seller' ||
      sessionRole === 'customer' ||
      sessionRole === 'courier'
    ) {
      return sessionRole;
    }
  }
  return inferRoleFromPath();
};

const inferLocale = (locale?: ErrorLocale): ErrorLocale => {
  void locale;
  return 'en';
};

const mapStatusToStandardCode = (status?: number): StandardErrorCode => {
  if (status === 401 || status === 403) return 'AUTH_ERROR';
  if (status === 422 || status === 400) return 'VALIDATION_ERROR';
  if (status === 404 || status === 409 || status === 429) return 'BUSINESS_ERROR';
  if (status === undefined) return 'SYSTEM_ERROR';
  return 'SYSTEM_ERROR';
};

const mapStandardReasonCode = (
  explicitReasonCode: string | undefined,
  rawCode: string | undefined,
  errorCode: StandardErrorCode,
) => {
  if (explicitReasonCode) return explicitReasonCode;

  if (errorCode === 'NETWORK_ERROR') return 'NO_INTERNET';
  if (rawCode === 'AUTH_REQUIRED') return 'SESSION_EXPIRED';
  if (rawCode === 'INVALID_CREDENTIALS') return 'INVALID_CREDENTIALS';
  if (errorCode === 'VALIDATION_ERROR') return 'VALIDATION_FAILED';
  if (errorCode === 'BUSINESS_ERROR') return 'BUSINESS_RULE_FAILED';
  return 'INTERNAL_ERROR';
};

export const getApiError = (
  error: unknown,
  fallback: string,
): ApiRequestError => {
  const safeError = asApiError(error);
  const directRecord = asRecord(error);
  const isAxiosError =
    Boolean(directRecord?.isAxiosError) ||
    (directRecord !== null && 'config' in directRecord);
  const serverData = safeError.response?.data;

  if (isAxiosError && !safeError.response) {
    const networkMessage =
      (typeof directRecord?.message === 'string' && directRecord.message) ||
      safeError.message ||
      fallback;
    return {
      message: networkMessage,
      code: typeof directRecord?.code === 'string' ? directRecord.code : undefined,
      errorCode: 'NETWORK_ERROR',
      reasonCode: 'NO_INTERNET',
      retryable: true,
    };
  }

  if (typeof serverData === 'string') {
    return {
      message: serverData || fallback,
      errorCode: mapStatusToStandardCode(safeError.response?.status),
      reasonCode: mapStandardReasonCode(
        undefined,
        undefined,
        mapStatusToStandardCode(safeError.response?.status),
      ),
      status: safeError.response?.status,
    };
  }

  const serverError =
    typeof serverData?.error === 'string' ? null : asRecord(serverData?.error);
  const details = toDetailsRecord(serverError?.details);
  const rawCode =
    typeof serverError?.code === 'string'
      ? serverError.code
      : typeof directRecord?.code === 'string'
        ? directRecord.code
        : undefined;
  const mappedErrorCode =
    (rawCode ? backendCodeToStandard[rawCode] : undefined) ||
    mapStatusToStandardCode(
      safeError.response?.status ||
        (typeof directRecord?.status === 'number' ? directRecord.status : undefined),
    );
  const explicitReasonCode =
    getReasonCode(details) ||
    (typeof directRecord?.reasonCode === 'string'
      ? directRecord.reasonCode
      : undefined);
  const traceId =
    (typeof details?.traceId === 'string' ? details.traceId : undefined) ||
    (typeof details?.correlationId === 'string'
      ? details.correlationId
      : undefined);
  const retryable =
    typeof details?.retryable === 'boolean' ? details.retryable : undefined;

  return {
    message:
      serverData?.message ||
      (typeof serverData?.error === 'string' ? serverData.error : undefined) ||
      (typeof directRecord?.message === 'string'
        ? directRecord.message
        : undefined) ||
      safeError.message ||
      fallback,
    code: rawCode,
    errorCode: mappedErrorCode,
    reasonCode: mapStandardReasonCode(explicitReasonCode, rawCode, mappedErrorCode),
    status:
      safeError.response?.status ||
      (typeof directRecord?.status === 'number' ? directRecord.status : undefined),
    details: details || toDetailsRecord(directRecord?.details),
    traceId:
      traceId ||
      (typeof directRecord?.traceId === 'string'
        ? directRecord.traceId
        : undefined),
    retryable:
      retryable ??
      (typeof directRecord?.retryable === 'boolean'
        ? directRecord.retryable
        : undefined),
  };
};

type ErrorMessageOptions = {
  role?: AuthRole;
  locale?: ErrorLocale;
};

export const getDisplayErrorMessage = (
  error: unknown,
  fallback: string,
  options: ErrorMessageOptions = {},
) => {
  const parsed = getApiError(error, fallback);
  const role = inferRole(options.role);
  const locale = inferLocale(options.locale);
  return resolveErrorMessage({
    errorCode: parsed.errorCode,
    reasonCode: parsed.reasonCode,
    role,
    locale,
    fallback: parsed.message || fallback,
  });
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  return getDisplayErrorMessage(error, fallback);
};

export const getThunkErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'string') {
    return error || fallback;
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }
  }

  return fallback;
};
