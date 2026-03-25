# Auth Migration TODO (JWT Storage -> HttpOnly Cookie)

## 1. Backend Contract (Required)
- [ ] Login and signup endpoints set auth cookie via `Set-Cookie` (HttpOnly, Secure, SameSite).
- [ ] Add/confirm logout endpoint that clears auth cookie.
- [ ] Ensure `/api/auth/users/profile` works from cookie session (no bearer header).
- [ ] Ensure `/sellers/profile` works from cookie session.
- [ ] CORS allows credentials for frontend origin.
- [ ] CSRF strategy finalized (`XSRF-TOKEN` cookie + `X-CSRF-Token` header).

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
- [ ] Customer login via OTP sets cookie, profile fetch succeeds.
- [ ] Seller login via OTP sets cookie, seller profile fetch succeeds.
- [ ] Page refresh keeps session (no localStorage dependency).
- [ ] Logout clears session cookie and protected APIs return 401.
- [ ] Cart CRUD works with cookie session.
- [ ] Seller product list/create works with cookie session.

## 5. Deployment Checklist
- [ ] Frontend and backend deployed on HTTPS.
- [ ] Cookie flags verified in production (`Secure`, `HttpOnly`, `SameSite`).
- [ ] CORS origin list restricted to trusted frontend domains.

