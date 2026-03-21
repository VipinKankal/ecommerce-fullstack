const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const env = {
  apiBaseUrl: trimTrailingSlash(
    process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  ),
} as const;
