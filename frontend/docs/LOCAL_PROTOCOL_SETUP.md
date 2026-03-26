# Local / Production Protocol Setup

## Summary

- The frontend supports either `http://` or `https://` API origins through `REACT_APP_API_BASE_URL`.
- One running frontend build can point to only one API origin at a time.
- Local development can stay on HTTP.
- Deployed environments should use HTTPS for both frontend and backend.

## Recommended Environment Matrix

| Environment | Frontend URL | API URL | Cookie expectation |
| --- | --- | --- | --- |
| Local development | `http://localhost:3000` | `http://localhost:8080` | Backend should not force `Secure=true` on auth cookie |
| Local HTTPS testing | `https://localhost:3000` | `https://localhost:8080` | `Secure` cookie can stay enabled |
| Staging / production | `https://...` | `https://...` | `Secure`, `HttpOnly`, and expected `SameSite` policy |

## How To Configure

1. Copy [`.env.example`](/d:/ecommerce-fullstack/frontend/.env.example) into a local env file such as `.env.local`.
2. Set `REACT_APP_API_BASE_URL` to the API origin for that environment.
3. Restart the frontend dev server after changing env values.

## Important Notes

- Frontend config can switch between HTTP and HTTPS by environment; it does not need a live host to work locally.
- Production transport verification is still a separate live-environment sign-off item.
- If local auth cookies do not persist on HTTP, backend cookie config usually needs a local/dev `Secure=false` setting.

## What Can Be Closed Without A Live Host

- Local manual QA for auth/session/cart/product flows
- Typecheck, tests, and build baseline
- Repo-level verification that API origin is environment-driven

## What Still Needs A Live Environment

- Browser proof that deployed frontend and backend both use HTTPS
- Production cookie-flag screenshots
- Production CORS header verification from the real frontend origin
