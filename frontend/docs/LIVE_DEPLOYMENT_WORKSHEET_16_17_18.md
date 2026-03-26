# Live Deployment Worksheet (#16, #17, #18)

Date: 2026-03-26  
Owner: Codex  
Environment: Blocked (no live HTTPS deployment URL available in repo/session)  
Frontend URL (HTTPS): ____________________  
Backend URL (HTTPS): ____________________  
Release / Commit: ____________________

## Source/Test Proof Collected

- Backend prod template expects trusted HTTPS origin only: `..\backend\docs\deployment\prod.env.example`
  - `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`
- Backend runtime config uses explicit origin list, not wildcard: `..\backend\src\main\java\com\example\ecommerce\common\configuration\AppConfiguration.java`
  - `config.setAllowedOrigins(origins)`
  - `config.setAllowCredentials(true)`
- Auth cookie service is config-driven: `..\backend\src\main\java\com\example\ecommerce\common\configuration\AuthCookieService.java`
  - cookie name default `ECOM_AUTH`
  - `secure` flag from `app.auth.cookie.secure`
  - `sameSite` from `app.auth.cookie.same-site`
- Targeted backend integration tests passed on 2026-03-26:
  - `SecurityIntegrationTests#logoutClearsCookieWithHttpOnlyAndSameSiteAttributes`
  - `SecurityIntegrationTests#corsPreflightAllowsConfiguredOriginAndCredentials`
  - Result: `BUILD SUCCESS`

## #16 Frontend + backend HTTPS deployment check

### Steps
1. Open deployed frontend URL and confirm it starts with `https://`.
2. Open DevTools -> Network and perform login.
3. Confirm API request URLs are also `https://`.
4. Open DevTools -> Console and check mixed content warnings.
5. Run smoke flow: login -> profile/cart(or seller page) -> logout.

### Expected
- Frontend URL uses HTTPS.
- Backend API calls use HTTPS.
- No mixed-content / insecure transport warnings.
- Smoke flow works without transport-security issues.

### Evidence
- Screenshot (frontend URL bar): ____________________
- Screenshot (network request URL): ____________________
- Screenshot (console clean/no mixed content): ____________________
- Result: Fail (blocked)
- Notes: No deployed frontend/backend URL available to verify real `https://` transport, Network tab requests, or browser mixed-content behavior.

---

## #17 Production cookie flags verify

### Steps
1. Login on deployed app.
2. Open DevTools -> Application -> Cookies.
3. Find auth cookie (`ECOM_AUTH` or configured cookie name).
4. Verify attributes: `Secure`, `HttpOnly`, `SameSite`.
5. Logout and verify cookie clear behavior (`Set-Cookie` with `Max-Age=0`).

### Expected
- Auth cookie exists after login.
- `Secure=true`
- `HttpOnly=true`
- `SameSite` matches expected policy.
- Logout clears cookie correctly.

### Evidence
- Cookie name: ____________________
- SameSite value: ____________________
- Screenshot (cookie attributes): ____________________
- Screenshot (`Set-Cookie` on logout): ____________________
- Result: Fail (blocked)
- Notes: Source/test proof exists for `ECOM_AUTH`, `HttpOnly`, logout clear, and `SameSite=Lax`, but `Secure=true` must be confirmed on real HTTPS deployment.

---

## #18 Trusted CORS origin restriction verify

### Steps
1. From deployed frontend, hit protected API.
2. Inspect response headers in DevTools Network.
3. Verify `Access-Control-Allow-Origin` exactly equals frontend origin.
4. Verify `Access-Control-Allow-Credentials: true`.
5. Confirm backend config does not use wildcard `*` with credentials.

### Expected
- Allowed origin header matches trusted frontend origin exactly.
- Credentials header is `true`.
- No permissive wildcard origin with credentials.

### Evidence
- Allowed origin seen: ____________________
- Credentials header seen: ____________________
- Screenshot (CORS headers): ____________________
- Config proof note: ____________________
- Result: Fail (blocked)
- Notes: Source/test proof confirms explicit origin + credentials behavior, but deployed origin value cannot be captured without the real host.

---

## Final Sign-off

- [ ] #16 Passed
- [ ] #17 Passed
- [ ] #18 Passed

Overall status: Blocked (needs live deployment)  
Sign-off by: ____________________
