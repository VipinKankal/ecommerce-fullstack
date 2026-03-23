export { api, publicApi } from 'shared/api/Api';
export { API_ROUTES } from 'shared/api/ApiRoutes';

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: {
        code?: string;
        details?: unknown;
      } | string;
    } | string;
  };
  message?: string;
};

const asApiError = (error: unknown): ApiErrorShape =>
  typeof error === 'object' && error !== null ? (error as ApiErrorShape) : {};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;

export interface ApiRequestError {
  message: string;
  code?: string;
  reasonCode?: string;
  status?: number;
  details?: Record<string, unknown>;
}

const toDetailsRecord = (value: unknown): Record<string, unknown> | undefined => {
  const details = asRecord(value);
  return details || undefined;
};

const getReasonCode = (details: unknown): string | undefined => {
  const record = asRecord(details);
  return typeof record?.reasonCode === 'string' ? record.reasonCode : undefined;
};

export const getApiError = (
  error: unknown,
  fallback: string,
): ApiRequestError => {
  const safeError = asApiError(error);
  const directRecord = asRecord(error);
  const serverData = safeError.response?.data;

  if (typeof serverData === 'string') {
    return {
      message: serverData || fallback,
      status: safeError.response?.status,
    };
  }

  const serverError =
    typeof serverData?.error === 'string' ? null : asRecord(serverData?.error);
  const details = toDetailsRecord(serverError?.details);

  return {
    message:
      serverData?.message ||
      (typeof serverData?.error === 'string' ? serverData.error : undefined) ||
      (typeof directRecord?.message === 'string' ? directRecord.message : undefined) ||
      safeError.message ||
      fallback,
    code:
      typeof serverError?.code === 'string'
        ? serverError.code
        : typeof directRecord?.code === 'string'
          ? directRecord.code
          : undefined,
    reasonCode:
      getReasonCode(details) ||
      (typeof directRecord?.reasonCode === 'string'
        ? directRecord.reasonCode
        : undefined),
    status:
      safeError.response?.status ||
      (typeof directRecord?.status === 'number' ? directRecord.status : undefined),
    details: details || toDetailsRecord(directRecord?.details),
  };
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  return getApiError(error, fallback).message;
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
