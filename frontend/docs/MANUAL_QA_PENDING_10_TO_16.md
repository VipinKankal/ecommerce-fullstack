# Manual QA Sheet - Pending Items #10 to #16

Date: 2026-03-25
Owner: ____________________
Environment: ____________________
Frontend URL: ____________________
Backend URL: ____________________
Build / Commit: ____________________

## #10 Customer OTP login cookie set + profile fetch QA

- [ ] Open `/login`
- [ ] Send OTP using valid customer email
- [ ] Complete OTP login successfully
- [ ] Verify `POST /api/auth/signin` returns success
- [ ] Verify signin response includes `Set-Cookie`
- [ ] Verify follow-up `GET /api/auth/users/profile` succeeds
- [ ] Verify auth cookie exists in browser cookie storage
- [ ] Verify no auth JWT is stored in `localStorage`
- [ ] Verify user lands on home page or intended redirect page

Evidence:
- Screenshot / note: ____________________
- Result: Pass / Fail
- Notes: ____________________

## #11 Seller OTP login cookie set + seller profile fetch QA

- [ ] Open `/become-seller?login=1`
- [ ] Send OTP using valid seller email
- [ ] Complete OTP login successfully
- [ ] Verify `POST /api/auth/signin` returns success
- [ ] Verify signin response includes `Set-Cookie`
- [ ] Verify follow-up `GET /sellers/profile` succeeds
- [ ] Verify seller dashboard loads
- [ ] Verify auth cookie exists in browser cookie storage
- [ ] Verify no auth JWT is stored in `localStorage`

Evidence:
- Screenshot / note: ____________________
- Result: Pass / Fail
- Notes: ____________________

## #12 Page refresh session persist QA

### Customer route refresh
- [ ] Login as customer
- [ ] Open `/checkout/cart` or `/account/orders`
- [ ] Hard refresh the page
- [ ] Verify loading guard appears briefly
- [ ] Verify page restores from cookie session without redirect

### Seller route refresh
- [ ] Login as seller
- [ ] Open `/seller/products`
- [ ] Hard refresh the page
- [ ] Verify loading guard appears briefly
- [ ] Verify page restores from cookie session without redirect

### Session storage dependency check
- [ ] While still logged in, run `sessionStorage.clear()` in browser console
- [ ] Refresh a protected page
- [ ] Verify protected page still restores from cookie session

Evidence:
- Screenshot / note: ____________________
- Result: Pass / Fail
- Notes: ____________________

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
- Screenshot / note: ____________________
- Result: Pass / Fail
- Notes: ____________________

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
- Screenshot / note: ____________________
- Result: Pass / Fail
- Notes: ____________________

## #15 Seller product list/create with cookie session QA

- [ ] Login as seller
- [ ] Open `/seller/products`
- [ ] Verify product list loads successfully
- [ ] Open create/add product flow
- [ ] Create a product with valid data
- [ ] Verify create request succeeds
- [ ] Refresh seller product routes
- [ ] Verify seller session still restores correctly from cookie flow

Evidence:
- Screenshot / note: ____________________
- Result: Pass / Fail
- Notes: ____________________

## #16 Frontend + backend HTTPS deployment check

- [ ] Open deployed frontend URL and confirm it uses `https://`
- [ ] Verify backend API requests also use `https://`
- [ ] Check browser console for mixed-content warnings
- [ ] Run a quick smoke flow: login, profile fetch, cart or seller page load, logout
- [ ] Confirm no insecure cookie or transport warnings appear

Evidence:
- Screenshot / note: ____________________
- Result: Pass / Fail
- Notes: ____________________

## Final Summary

- [ ] #10 Passed
- [ ] #11 Passed
- [ ] #12 Passed
- [ ] #13 Passed
- [ ] #14 Passed
- [ ] #15 Passed
- [ ] #16 Passed

Overall status: ____________________
Sign-off: ____________________
