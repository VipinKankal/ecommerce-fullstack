export { api, publicApi } from 'shared/api/Api';
export { API_ROUTES } from 'shared/api/ApiRoutes';

type ApiErrorShape = {
  response?: {
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

export const getErrorMessage = (error: unknown, fallback: string) => {
  const safeError = asApiError(error);
  const serverData = safeError.response?.data;

  if (typeof serverData === 'string') {
    return serverData || fallback;
  }

  return (
    serverData?.message ||
    (typeof serverData?.error === 'string' ? serverData.error : undefined) ||
    safeError.message ||
    fallback
  );
};
