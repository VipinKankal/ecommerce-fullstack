# Pending With Deployment - 2026-03-26

Status date: 2026-03-26
Scope: Real deployed HTTPS environment required

## Pending Count

- Total pending buckets: 3
- All 3 require real live frontend + backend URLs

## Pending Work

### 1. Frontend + backend HTTPS deployment check

- QA item: `#16`
- Status: Pending
- Needed to close:
  - Open deployed frontend on `https://`
  - Confirm API requests also use `https://`
  - Check no mixed-content warnings in browser console
  - Run smoke flow on the live app

### 2. Production cookie flags verification

- QA item: `#17`
- Status: Pending
- Needed to close:
  - Login on deployed app
  - Inspect auth cookie in browser
  - Confirm `Secure=true`, `HttpOnly=true`, and expected `SameSite`
  - Confirm logout clears cookie correctly

### 3. Trusted CORS origin verification

- QA item: `#18`
- Status: Pending
- Needed to close:
  - Hit protected API from deployed frontend
  - Inspect `Access-Control-Allow-Origin`
  - Confirm it matches exact frontend origin
  - Confirm `Access-Control-Allow-Credentials: true`

## Required Input To Finish

- Live frontend URL
- Live backend URL
- Browser access to deployed environment

## Practical Summary

- Deployment pending work is exactly 3 buckets.
- Without real deployed HTTPS URLs, these items cannot be truthfully marked complete.
