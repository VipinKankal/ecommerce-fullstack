# Auth Migration TODO (JWT Storage -> HttpOnly Cookie)

## 1. Backend Contract (Required)
- [x] Login and signup endpoints set auth cookie via `Set-Cookie` (HttpOnly, Secure, SameSite).
- [x] Add/confirm logout endpoint that clears auth cookie.
- [x] Ensure `/api/auth/users/profile` works from cookie session (no bearer header).
- [x] Ensure `/sellers/profile` works from cookie session.
- [x] CORS allows credentials for frontend origin.
- [x] CSRF strategy finalized (`XSRF-TOKEN` cookie + `X-CSRF-Token` header).

## 2. Frontend Implemented in this change
- [x] Removed client-side JWT persistence (`localStorage`).
- [x] Enabled `withCredentials` in Axios clients.
- [x] Added axios XSRF cookie/header config.
- [x] Switched auth bootstrap to profile-based session checks.
- [x] Removed JWT params from cart/seller thunks and components.

## 3. Frontend Follow-up
- [x] Add centralized 401 handling (clear auth state + redirect).
- [x] Add loading guards for routes dependent on profile bootstrap.
- [x] Add UI for unauthenticated cart/add-to-cart server 401 responses.

## 4. Testing Checklist
- [x] Customer login via OTP sets cookie, profile fetch succeeds.
- [x] Seller login via OTP sets cookie, seller profile fetch succeeds.
- [x] Page refresh keeps session (no localStorage dependency).
- [x] Logout clears session cookie and protected APIs return 401.
- [x] Cart CRUD works with cookie session.
- [x] Seller product list/create works with cookie session.

## 5. Deployment Checklist
- [ ] Deployed frontend and backend are on HTTPS (local development may stay on HTTP).
- [ ] Cookie flags verified in production (`Secure`, `HttpOnly`, `SameSite`).
- [ ] CORS origin list restricted to trusted frontend domains.

