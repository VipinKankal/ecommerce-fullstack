# Pending Work Closeout - 2026-03-25

## Repo-Level Completed

### #7 Centralized 401 handling
- Added a protected `api` response interceptor that clears client auth state and triggers a role-aware redirect.
- Session-expired redirects now preserve the intended destination and show a login notice on the next auth screen.

### #8 Global bootstrap loading guards
- Protected customer, seller, and admin routes now wait for profile bootstrap before redirecting.
- Refresh on cookie-backed protected routes now attempts profile bootstrap even when `sessionStorage` has no role yet.

### #9 Unauthenticated cart / add-to-cart UX
- Customer add-to-cart, buy-now, wishlist, and product-details flows now redirect to login with a friendly message instead of failing silently.
- Expired session cart/wishlist requests now route through the same centralized login recovery flow.

### #10 Customer OTP login cookie set + profile fetch QA
- Added backend integration coverage for customer OTP login using a cookie-aware HTTP client.
- The test now verifies `/api/auth/signin` returns `Set-Cookie` for `ECOM_AUTH` and that `/api/auth/users/profile` succeeds on the same cookie-backed session.

### #11 Seller OTP login cookie set + seller profile fetch QA
- Added backend integration coverage for seller OTP login using `seller_`-prefixed signin and a cookie-aware HTTP client.
- The test now verifies `/api/auth/signin` returns `Set-Cookie` for `ECOM_AUTH` and that `/sellers/profile` succeeds on the same cookie-backed session.

### #12 Page refresh session persist QA
- Added app-level refresh bootstrap regression test covering a protected customer route with empty `sessionStorage`.
- The test verifies that route-based role fallback still triggers customer profile bootstrap (`getUserProfile`) when no `auth_role` is present, matching cookie-session restore behavior.

### #13 Logout cookie clear + protected APIs 401 QA
- Added backend integration coverage for `login -> logout -> protected API` using the same cookie-aware HTTP client.
- The test verifies logout returns a cookie-clearing `Set-Cookie` (`ECOM_AUTH` with `Max-Age=0`) and that subsequent `/api/auth/users/profile` access returns `401`.

### #14 Cart CRUD with cookie session QA
- Added backend integration coverage for cookie-authenticated cart CRUD flow (`add -> update -> delete -> fetch`).
- The test verifies cart operations succeed with cookie session + CSRF token and ends with an empty cart (`totalItems: 0`) after delete.

### #15 Seller product list/create with cookie session QA
- Added backend integration coverage for seller cookie session flow to create a product and fetch seller product list.
- The test verifies seller OTP cookie login, CSRF-backed `POST /api/sellers/products`, and successful `GET /api/sellers/products` in the same session.

### #16 Frontend + backend HTTPS deployment check
- Added a repository-level deployment verification note with concrete frontend/backend HTTPS evidence.
- Verified frontend API base URL is env-driven and backend deployment templates/checklists require HTTPS frontend origin and TLS-backed deployment controls.

### #17 Cookie flags verification at code/test level
- Backend auth cookie service writes `HttpOnly`, configurable `Secure`, and configurable `SameSite` attributes.
- Backend security integration test now verifies logout response returns cookie-clearing `Set-Cookie` headers with `HttpOnly`, `SameSite=Lax`, and `Max-Age=0` in the test profile.

### #18 Trusted CORS origin restriction verification at code/test level
- Backend security config reads `app.cors.allowed-origins`, applies an explicit allow-list, and enables credentials only for allowed origins.
- Backend security integration test now verifies CORS preflight returns the configured origin and `Access-Control-Allow-Credentials: true`.

### #22 Oversized files audit and split plan
- Oversized `.ts/.tsx` files were audited.
- A prioritized split plan is documented below.

## Verification Evidence
- Frontend: `npm.cmd run lint` passed
- Frontend: `npx.cmd tsc --noEmit` passed
- Frontend: `npm.cmd run build` passed on 2026-03-25
- Frontend: `npm.cmd run test:ci` passed on 2026-03-25
- Frontend: `npm.cmd run test -- --watchAll=false --runInBand src/App.test.tsx` passed on 2026-03-25
- Backend: `./mvnw.cmd -Dtest=SecurityIntegrationTests test` passed on 2026-03-25 after setting `JAVA_HOME`
- Added frontend auth/session regression coverage for session helpers and protected route behavior.
- Added backend security integration coverage for customer OTP cookie login + profile fetch, seller OTP cookie login + seller profile fetch, logout cookie clear + protected `401` behavior, cart CRUD via cookie session, seller product list/create via cookie session, logout cookie headers, and CORS preflight behavior.

## Manual / Environment-Dependent Items Still Required
- Browser/live environment screenshots for production sign-off remain required where applicable.

## Backend Source / Test Proof
- `../backend/src/main/java/com/example/ecommerce/common/configuration/AuthCookieService.java`: `httpOnly(true)`, `.secure(secureCookie)`, `.sameSite(sameSite)` on both write and clear paths.
- `../backend/src/main/java/com/example/ecommerce/common/configuration/AppConfiguration.java`: `app.cors.allowed-origins` property, explicit `setAllowedOrigins(origins)`, `setAllowCredentials(true)`, and Spring Security default logout disabled so the custom `/api/auth/logout` controller clears cookies.
- `../backend/src/main/resources/application.properties`: `app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000}` plus frontend/backend base URL properties.
- `docs/DEPLOYMENT_HTTPS_VERIFICATION_NOTE_2026-03-25.md`: repo-level HTTPS deployment verification note for `#16`.
- `../backend/src/test/java/com/example/ecommerce/SecurityIntegrationTests.java`: verifies anonymous protection, rate limiting, customer OTP cookie login + profile fetch, seller OTP cookie login + seller profile fetch, logout cookie clear + protected `401` behavior, cart CRUD with cookie session, seller product list/create with cookie session, logout cookie clearing headers, and CORS preflight behavior.
- `../backend/src/main/java/com/example/ecommerce/common/configuration/InventorySchemaCompatibilityInitializer.java`: updated with safer unique-index metadata fallback so H2-backed security verification can boot.
- `../backend/src/test/resources/application-test.properties`: updated with `NON_KEYWORDS=USER` so H2 can exercise the existing `user` table mappings during auth verification.
- `src/App.test.tsx`: verifies protected-route refresh bootstrap triggers customer profile restore even when `sessionStorage` role is missing.

## #22 Oversized Files Audit

Provisional audit baseline used here: highlight files above ~350 lines until the team confirms the final threshold.

Top oversized `.ts/.tsx` files:
- `src/features/admin/Pages/Dashboard/AdminWarehouseStock.tsx` - 2194 lines
- `src/features/seller/products/components/ProductsTable.tsx` - 832 lines
- `src/features/courier/courierData.ts` - 778 lines
- `src/features/admin/exchanges/AdminExchangeRequests.tsx` - 736 lines
- `src/features/admin/returns/AdminReturnRequests.tsx` - 647 lines
- `src/features/seller/products/pages/components/AddProductFormBody.tsx` - 604 lines
- `src/features/admin/Coupon/AddNewCouponFrom.tsx` - 562 lines
- `src/features/customer/pages/Account/OrderDetails.tsx` - 549 lines
- `src/features/admin/Pages/Sellers/SellersTable.tsx` - 450 lines
- `src/features/customer/checkout/pages/CheckoutPage.tsx` - 429 lines

Suggested split order:
1. `AdminWarehouseStock.tsx`: separate table config, dialogs, transfer recommendation logic, and filter toolbar.
2. `ProductsTable.tsx`: separate data transforms, action handlers, and inventory/demand presentation blocks.
3. `courierData.ts`: split static fixtures/config from transformation helpers.
4. `AdminExchangeRequests.tsx` and `AdminReturnRequests.tsx`: extract status helpers, dialogs, and row/action sections.
5. `CheckoutPage.tsx`: keep orchestration only; move summary fetch and route guard helpers into hooks.

## Notes
- Customer OTP and seller OTP flows are now verified at automated backend integration-test level; browser proof for DevTools cookie visibility still requires running environment access.
- Browser-level refresh/cart/seller UX proof still requires running environment access.
- Repo-level auth, cookie, CORS, and refactor-planning work is completed in this pass.
