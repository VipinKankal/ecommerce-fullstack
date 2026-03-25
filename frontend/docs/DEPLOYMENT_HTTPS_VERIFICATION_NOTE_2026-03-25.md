# Deployment HTTPS Verification Note - 2026-03-25

## Scope
- Item: `#16 Frontend + backend HTTPS deployment check`
- Verification type: code/config and deployment-template proof (repo-level)

## Evidence Summary
- Frontend API base URL is environment-driven and does not hardcode production `http://`.
- Frontend HTTP client is cookie-session ready (`withCredentials: true`) for secure cross-origin auth flow.
- Backend production env template requires HTTPS frontend origin in CORS configuration.
- Backend preflight checklist explicitly requires HTTPS/TLS in production.
- Backend runtime config supports environment-driven frontend/backend base URLs and CORS allow-list.

## Proof References
- `frontend/src/shared/api/Api.ts`
  - `REACT_APP_API_BASE_URL` driven `baseURL`
  - `withCredentials: true`
- `frontend/src/config/env.ts`
  - `REACT_APP_API_BASE_URL` environment fallback wiring
- `backend/docs/deployment/prod.env.example`
  - `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`
  - DB URL template uses TLS option (`useSSL=true`)
- `backend/docs/deployment/DEPLOYMENT_PREFLIGHT.md`
  - Security controls section includes: app runs behind HTTPS (TLS cert valid)
- `backend/src/main/resources/application.properties`
  - `app.frontend.base-url`, `app.backend.base-url`, `app.cors.allowed-origins` are env-driven

## Result
- `#16` status: Completed at repository/deployment-config verification level.
- Live browser-origin proof (DevTools mixed-content and transport warnings) remains environment-run dependent and should be captured during production smoke sign-off.
