#!/usr/bin/env node

const rawApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim();

if (!rawApiBaseUrl) {
  console.error(
    '[env-check] Missing REACT_APP_API_BASE_URL for production build. Set a real backend URL before running npm run build.',
  );
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(rawApiBaseUrl);
} catch (error) {
  console.error(
    `[env-check] REACT_APP_API_BASE_URL is not a valid URL: "${rawApiBaseUrl}"`,
  );
  process.exit(1);
}

if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
  console.error(
    `[env-check] REACT_APP_API_BASE_URL must use http/https protocol. Received: "${parsedUrl.protocol}"`,
  );
  process.exit(1);
}

const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
if (blockedHosts.has(parsedUrl.hostname.toLowerCase())) {
  console.error(
    `[env-check] Production build cannot use local API host (${parsedUrl.hostname}). Set deployed backend URL.`,
  );
  process.exit(1);
}
