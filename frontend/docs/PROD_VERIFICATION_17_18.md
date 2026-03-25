# Production Verification Sheet - Items #17 and #18

Date: 2026-03-25
Owner: ____________________
Environment: ____________________
Frontend Origin: ____________________
Backend Origin: ____________________
Deployment URL: ____________________
Release / Commit: ____________________

## Pre-Verified (Repo + Automated QA)

- Automated backend verification executed on 2026-03-25:
  - Command: `./mvnw.cmd "-Dtest=SecurityIntegrationTests#logoutClearsCookieWithHttpOnlyAndSameSiteAttributes,SecurityIntegrationTests#corsPreflightAllowsConfiguredOriginAndCredentials" test`
  - Result: `Tests run: 2, Failures: 0, Errors: 0` (`BUILD SUCCESS`)
- Cookie clear/header assertions already validated in integration test:
  - `ECOM_AUTH` present in `Set-Cookie`
  - `HttpOnly` present
  - `SameSite=Lax` present (test profile policy)
  - `Max-Age=0` on logout clear
- CORS preflight assertions already validated in integration test:
  - `Access-Control-Allow-Origin` equals configured origin
  - `Access-Control-Allow-Credentials` equals `true`
- Production template/config proof available:
  - Backend prod env template has `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`
  - Backend preflight checklist requires HTTPS/TLS for deployment

## #17 Production cookie flags verify

### Auth cookie presence
- [ ] Login successfully in production
- [ ] Open browser DevTools > Application > Cookies
- [ ] Identify auth cookie name
- [ ] Confirm auth cookie is present after login

### Auth cookie attributes
- [ ] Confirm `Secure` flag is enabled
- [ ] Confirm `HttpOnly` flag is enabled
- [ ] Confirm `SameSite` value matches expected policy
- [ ] Confirm cookie path/domain are correct for deployment
- [ ] Confirm logout clears the same cookie

### Header proof
- [ ] Capture `Set-Cookie` response header from login or logout response
- [ ] Save screenshot or paste raw header value in notes

Evidence:
- Cookie name: ____________________
- `SameSite` value: ____________________
- Screenshot / note: ____________________
- Result: Pass / Fail (manual live check)
- Notes: ____________________

## #18 Trusted CORS origin restriction verify

### Allowed origin behavior
- [ ] Trigger a production API request from the real frontend origin
- [ ] Inspect response headers in DevTools Network tab
- [ ] Confirm `Access-Control-Allow-Origin` matches the trusted frontend origin exactly
- [ ] Confirm `Access-Control-Allow-Credentials` is `true`

### Restriction validation
- [ ] Confirm backend env/config only includes trusted frontend origins
- [ ] Confirm wildcard `*` is not used with credentials
- [ ] If staging/proxy tools are available, test an untrusted origin and confirm it is rejected or not allowed

### Proof capture
- [ ] Capture screenshot or note showing `Access-Control-Allow-Origin`
- [ ] Capture screenshot or note showing `Access-Control-Allow-Credentials`
- [ ] Record source of deployment config proof if infra team provided it

Evidence:
- Allowed origin seen: ____________________
- Credentials header seen: ____________________
- Screenshot / note: ____________________
- Result: Pass / Fail (manual live check)
- Notes: ____________________

## Final Summary

- [ ] #17 Passed
- [ ] #18 Passed

Overall status: ____________________
Sign-off: ____________________
