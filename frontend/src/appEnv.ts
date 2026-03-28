const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const localDevApiBaseUrl = 'http://localhost:8080';
const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const resolveApiBaseUrl = () => {
  const rawApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim();
  const isProductionBuild = process.env.NODE_ENV === 'production';

  if (!isProductionBuild) {
    return trimTrailingSlash(rawApiBaseUrl || localDevApiBaseUrl);
  }

  if (!rawApiBaseUrl) {
    throw new Error(
      'Missing REACT_APP_API_BASE_URL for production build. Configure deployed backend API URL.',
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawApiBaseUrl);
  } catch (error) {
    throw new Error(
      `Invalid REACT_APP_API_BASE_URL "${rawApiBaseUrl}". Expected absolute http/https URL.`,
    );
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(
      `Invalid REACT_APP_API_BASE_URL protocol "${parsedUrl.protocol}". Use http or https.`,
    );
  }

  if (blockedHosts.has(parsedUrl.hostname.toLowerCase())) {
    throw new Error(
      `REACT_APP_API_BASE_URL cannot target local host (${parsedUrl.hostname}) in production build.`,
    );
  }

  return trimTrailingSlash(rawApiBaseUrl);
};

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
} as const;
