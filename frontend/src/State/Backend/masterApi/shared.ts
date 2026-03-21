export { api, publicApi } from 'shared/api/Api';
export { API_ROUTES } from 'shared/api/ApiRoutes';

type ApiErrorShape = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
};

const asApiError = (error: unknown): ApiErrorShape =>
  typeof error === 'object' && error !== null ? (error as ApiErrorShape) : {};

export const getErrorMessage = (error: unknown, fallback: string) => {
  const safeError = asApiError(error);
  return (
    safeError.response?.data?.message ||
    safeError.response?.data?.error ||
    safeError.message ||
    fallback
  );
};
