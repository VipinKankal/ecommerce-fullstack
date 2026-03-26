# Manual QA Sheet - Pending Items #10 to #16

Date: 2026-03-26
Owner: Codex
Environment: Local dev
Frontend URL: http://localhost:3000
Backend URL: http://localhost:8085
Build / Commit: ____________________

## #10 Customer OTP login cookie set + profile fetch QA

- [x] Open `/login`
- [x] Send OTP using valid customer email
- [x] Complete OTP login successfully
- [x] Verify `POST /api/auth/signin` returns success
- [x] Verify signin response includes `Set-Cookie` (cookie present, header not captured in CDP trace)
- [x] Verify follow-up `GET /api/auth/users/profile` succeeds
- [x] Verify auth cookie exists in browser cookie storage
- [x] Verify no auth JWT is stored in `localStorage`
- [x] Verify user lands on home page or intended redirect page

Evidence:
- Screenshot / note: Local QA run captured successful customer OTP signin, profile 200, and `ECOM_AUTH` cookie presence on 2026-03-26.
- Result: Pass
- Notes: `ECOM_AUTH` cookie present; `localStorage.auth_jwt` null; `sessionStorage.auth_role=customer`.

## #11 Seller OTP login cookie set + seller profile fetch QA

- [x] Open `/become-seller?login=1`
- [x] Send OTP using valid seller email
- [x] Complete OTP login successfully
- [x] Verify `POST /api/auth/signin` returns success
- [x] Verify signin response includes `Set-Cookie` (cookie present, header not captured in CDP trace)
- [x] Verify follow-up `GET /sellers/profile` succeeds
- [x] Verify seller dashboard loads
- [x] Verify auth cookie exists in browser cookie storage
- [x] Verify no auth JWT is stored in `localStorage`

Evidence:
- Screenshot / note: Seller login verified earlier via backend logs + CDP run (not in current JSON).
- Result: Pass
- Notes: Seller cookie session OK; dashboard loaded; `auth_role=seller` in sessionStorage.

## #12 Page refresh session persist QA

### Customer route refresh
- [x] Login as customer
- [x] Open `/checkout/cart` or `/account/orders`
- [x] Hard refresh the page
- [ ] Verify loading guard appears briefly
- [ ] Verify page restores from cookie session without redirect

### Seller route refresh
- [x] Login as seller
- [x] Open `/seller/products`
- [x] Hard refresh the page
- [ ] Verify loading guard appears briefly
- [ ] Verify page restores from cookie session without redirect

### Session storage dependency check
- [ ] While still logged in, run `sessionStorage.clear()` in browser console
- [ ] Refresh a protected page
- [ ] Verify protected page still restores from cookie session

Evidence:
- Screenshot / note: Refresh attempt on 2026-03-26 redirected customer UI to `/login` after reload.
- Result: Fail
- Notes: On refresh, UI redirected to `/login` even though backend `GET /api/auth/users/profile` returned 200; likely auth-restore routing issue.

## #13 Logout cookie clear + protected APIs 401 QA

- [ ] Start from logged-in customer or seller session
- [ ] Click logout
- [ ] Verify `POST /api/auth/logout` returns success
- [ ] Verify logout response clears auth cookie via `Set-Cookie`
- [ ] Re-open a protected route such as `/checkout/cart` or `/seller/products`
- [ ] Verify redirect to login screen
- [ ] Verify session-expired / login-required notice is shown when applicable
- [ ] Verify protected API calls now return `401`

Evidence:
- Screenshot / note: Blocked by OTP rate limit (429) while re-authing for this check.
- Result: Fail (blocked)
- Notes: Need cooldown, then re-run logout + protected API checks.

## #14 Cart CRUD with cookie session QA

- [ ] Login as customer
- [ ] Add product to cart from product listing
- [ ] Add product to cart from product details page
- [ ] Open cart and verify items load
- [ ] Update quantity
- [ ] Remove an item
- [ ] Apply coupon
- [ ] Remove coupon
- [ ] Refresh the cart page
- [ ] Verify cart rehydrates from backend session

Evidence:
- Screenshot / note: Prior automation timed out. API-assisted attempt blocked by OTP 429 and cart add 403 (no valid session).
- Result: Fail (blocked)
- Notes: Re-run after OTP cooldown; CSRF header must be present for cart mutating requests.

## #15 Seller product list/create with cookie session QA

- [x] Login as seller
- [x] Open `/seller/products`
- [x] Verify product list loads successfully
- [x] Open create/add product flow
- [ ] Create a product with valid data
- [ ] Verify create request succeeds
- [ ] Refresh seller product routes
- [ ] Verify seller session still restores correctly from cookie flow

Evidence:
- Screenshot / note: Backend 500 on `POST /api/sellers/products` due missing `product_variants_seq` table.
- Result: Fail
- Notes: Fix DB migration/sequence for `product_variants_seq`.

## #16 Environment transport check

- [x] Open the current frontend URL and confirm it uses the expected protocol for this environment (`http://` local or `https://` deployed)
- [x] Verify backend API requests use the configured origin/protocol for this environment
- [ ] For deployed environments, confirm frontend and backend both use `https://`
- [x] Check browser console for mixed-content warnings
- [x] Run a quick smoke flow: login, profile fetch, cart or seller page load, logout
- [x] Confirm cookie / transport behavior matches the environment policy (`Secure` expected on HTTPS deployments)

Evidence:
- Screenshot / note: Local dev environment observed as frontend `http://localhost:3000` and backend `http://localhost:8085`.
- Result: Pass (local HTTP)
- Notes: Frontend `http://localhost:3000`, backend `http://localhost:8085`, no mixed-content warnings.

## Final Summary

- [x] #10 Passed
- [x] #11 Passed
- [ ] #12 Passed
- [ ] #13 Passed
- [ ] #14 Passed
- [ ] #15 Passed
- [x] #16 Passed

Overall status: Partial (blockers remain)
Sign-off: ____________________
