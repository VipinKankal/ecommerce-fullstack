# GST Endpoint Smoke Test - 2026-03-26

## Scope

Authenticated local runtime smoke test for the new GST / HSN rollout after backend boot, Flyway migration, and security chain verification.

Environment:
- Backend booted locally against the real MySQL database
- Smoke run executed on `http://localhost:8085`
- Migration `V28__add_gst_hsn_rollout_tables.sql` applied before testing

## Endpoints Covered

Admin auth and management:
- `POST /api/admin/login`
- `POST /api/admin/hsn-master`
- `POST /api/admin/hsn-master/{id}/publish`
- `GET /api/admin/hsn-master`
- `POST /api/admin/tax-rules`
- `POST /api/admin/tax-rules/{id}/publish`
- `GET /api/admin/tax-rules`
- `POST /api/admin/tax-rules/resolve`
- `GET /api/admin/product-tax-reviews`
- `PATCH /api/admin/product-tax-reviews/{id}`

Seller and order flow:
- `POST /auth/signin`
- `GET /sellers/profile`
- `POST /api/sellers/tax-rules/preview`
- `POST /api/sellers/products`
- `PUT /api/cart/add`
- `POST /api/orders/summary`

Health checks:
- `GET /actuator/health/liveness`
- `GET /actuator/health/readiness`
- `GET /actuator/health`

## Result

Status: `PASS`

Verified outcomes:
- Admin login worked with CSRF + session flow
- Seller login worked with OTP-backed session flow
- HSN master create/publish worked
- GST rule create/publish worked
- TCS rule create/publish worked
- Admin rule resolve returned the published GST rule and expected `5%` rate
- Seller tax preview resolved:
  - suggested HSN `6205`
  - GST rule code from the published smoke rule
  - rate `5%`
  - review status `NOT_REQUIRED`
- Seller product create with auto HSN worked and product stayed active
- Seller product create with HSN override worked and product moved to `PENDING_REVIEW`
- Admin review queue returned the pending review
- Admin approval patch worked and approved review became visible in the queue
- Checkout summary returned populated tax fields:
  - `taxableAmount`
  - `igst`
  - `totalTax`
  - `valueBasis`

Observed response highlights:
- Seller preview HSN: `6205`
- Seller preview GST rate: `5.0`
- Checkout summary value basis: `SELLING_PRICE_PER_PIECE`
- Checkout summary total tax: `414.05`
- Override review final status: `APPROVED`

## Bug Found During Smoke

Issue:
- `GET /api/admin/product-tax-reviews?reviewStatus=PENDING_REVIEW` was failing with `500`

Root cause:
- `LazyInitializationException` while converting `review.getProduct()` in the admin response mapper path

Fix:
- Added fetch-join repository queries in [ProductTaxReviewRepository.java](/d:/ecommerce-fullstack/backend/src/main/java/com/example/ecommerce/repository/ProductTaxReviewRepository.java)
- Updated [ProductTaxReviewServiceImpl.java](/d:/ecommerce-fullstack/backend/src/main/java/com/example/ecommerce/tax/service/impl/ProductTaxReviewServiceImpl.java) to use those eager-loading queries for review lists

Verification after fix:
- Backend recompiled successfully
- Full authenticated smoke rerun passed

## Notes

- Aggregate `/actuator/health` still returns `503` locally because mail health is not configured, while liveness/readiness are both healthy
- Checkout summary returned `appliedRuleCode = MIXED` in the smoke run because the local cart already contained existing items with mixed rule context
- One local stock adjustment was needed on the smoke fixture product so cart add could proceed; this was a test-data workaround, not an application code change

## Remaining Work

- Run browser QA from [MANUAL_QA_PENDING_10_TO_16.md](/d:/ecommerce-fullstack/frontend/docs/MANUAL_QA_PENDING_10_TO_16.md)
- Run deployment checks from [LIVE_DEPLOYMENT_WORKSHEET_16_17_18.md](/d:/ecommerce-fullstack/frontend/docs/LIVE_DEPLOYMENT_WORKSHEET_16_17_18.md)
- Do final cleanup and commit after QA closeout
