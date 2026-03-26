# GST / HSN Today Action Plan - 2026-03-26

## Current Status

Completed:
- Frontend GST / HSN rollout implemented
- Seller onboarding GST policy flow implemented
- Seller add-product tax preview flow implemented
- Checkout summary request updated to send structured shipping address
- Customer and seller order tax snapshot UI added
- Admin tax rule / HSN master / tax review panels added
- Backend `mvn compile` passed after fixing one missing import and one helper call
- Backend targeted GST tests passed:
  - `TaxRuleVersionServiceImplTest`
  - `OrderTaxSnapshotServiceSmokeTest`
- Backend booted successfully against the real local MySQL instance
- Flyway applied migration `V28__add_gst_hsn_rollout_tables.sql`
- Runtime smoke checks passed for health probes and mounted GST routes
- Live GST endpoint smoke test passed against local backend on `8085`
- Seller product create + override-review API smoke passed
- Admin tax review queue lazy-load bug fixed and verified
- Detailed smoke record captured in [GST_ENDPOINT_SMOKE_TEST_2026-03-26.md](/d:/ecommerce-fullstack/frontend/docs/GST_ENDPOINT_SMOKE_TEST_2026-03-26.md)
- `npm.cmd run typecheck` passed
- `npm.cmd run test:ci` passed
- `npm.cmd run build` passed

Still pending:
- Manual browser QA `#10` to `#16`
- Live deployment verification `#16` to `#18`
- Final cleanup, review, and commit

## Priority Order

1. Backend verification
2. Local manual QA
3. Live deployment verification
4. Final cleanup and commit

## Today Todo

### P0. Verify backend actually runs with new GST / HSN code

- [x] Compile backend with the new GST / HSN code
- [x] Run targeted backend GST tests
- [x] Start backend locally with the new migration set
- [x] Confirm migration `V28__add_gst_hsn_rollout_tables.sql` applies
- [x] Confirm seller tax preview route is mounted and protected:
  - `POST /api/sellers/tax-rules/preview` -> `403` without auth / CSRF token
- [x] Confirm checkout summary route is mounted and protected:
  - `POST /api/orders/summary` -> `403` without auth / CSRF token
- [x] Confirm admin endpoints are mounted and protected:
  - `/api/admin/tax-rules` -> `401`
  - `/api/admin/hsn-master` -> `401`
  - `/api/admin/product-tax-reviews` -> `401`
- [x] Smoke test seller product create from backend side
- [x] Smoke test authenticated admin GST management endpoints
- [x] Smoke test authenticated checkout summary tax response

Definition of done:
- Backend starts cleanly
- No migration failure
- New GST / HSN endpoints return valid responses

Current result:
- `mvn -DskipTests compile` passed
- `mvn -Dtest=TaxRuleVersionServiceImplTest,OrderTaxSnapshotServiceSmokeTest test` passed
- Backend started on local port `8084`
- Flyway migrated schema from `27` to `28`
- `/actuator/health/liveness` -> `200`
- `/actuator/health/readiness` -> `200`
- `/actuator/health` -> `503` because local mail health is not configured
- Full authenticated API smoke was then completed on local port `8085`:
  - admin login -> HSN create/publish -> GST rule create/publish -> TCS rule create/publish -> GST resolve
  - seller login -> tax preview -> auto HSN product create -> override HSN product create
  - admin review queue -> approve override review
  - checkout summary returned tax breakdown fields
- One real backend bug was found during smoke and fixed:
  - `GET /api/admin/product-tax-reviews` was throwing `LazyInitializationException`
  - fixed by fetching product with the review query
- This means core app boot, DB, Flyway, JPA, and authenticated GST route flows are now verified; remaining work is browser QA and deployment QA
- Full endpoint-by-endpoint notes are in [GST_ENDPOINT_SMOKE_TEST_2026-03-26.md](/d:/ecommerce-fullstack/frontend/docs/GST_ENDPOINT_SMOKE_TEST_2026-03-26.md)

Next action to close P0:
- Run authenticated browser QA for seller/admin flows
- Optionally disable or configure local mail health if a green aggregate `/actuator/health` response is required

### P1. Run local browser QA from existing worksheet

Use: [MANUAL_QA_PENDING_10_TO_16.md](/d:/ecommerce-fullstack/frontend/docs/MANUAL_QA_PENDING_10_TO_16.md)

- [ ] `#10` Customer OTP login cookie + profile fetch
- [ ] `#11` Seller OTP login cookie + seller profile fetch
- [ ] `#12` Refresh session persist
- [ ] `#13` Logout cookie clear + protected API `401`
- [ ] `#14` Cart CRUD with cookie session
- [ ] `#15` Seller product list/create with cookie session
- [ ] `#16` Local transport/protocol check

Extra GST-specific checks during `#15`:
- [ ] Create one apparel product with auto HSN
- [ ] Verify tax preview resolves
- [ ] Create one manual override HSN request
- [ ] Verify product goes into review/pending state when applicable
- [ ] Create one fibre-sensitive category test if available

Definition of done:
- Worksheet filled with pass/fail and evidence notes

### P2. Run live deployment verification when host is ready

Use: [LIVE_DEPLOYMENT_WORKSHEET_16_17_18.md](/d:/ecommerce-fullstack/frontend/docs/LIVE_DEPLOYMENT_WORKSHEET_16_17_18.md)

- [ ] `#16` HTTPS frontend + backend smoke check
- [ ] `#17` Production cookie flags check
- [ ] `#18` Trusted CORS restriction check

Definition of done:
- All three sections filled with screenshots/notes
- Final sign-off section completed

### P3. Final repo cleanup and closeout

- [ ] Review frontend changes once
- [ ] Review backend changes once
- [ ] Update any stale docs that still mention old GST gap status
- [ ] Remove any obsolete TODO notes if no longer valid
- [ ] Make final commit after backend verification + QA

Definition of done:
- Repo is ready for handoff or merge

## Fastest Path To Finish Today

If time is limited, do this exact order:

1. Run local seller add-product GST QA
2. Run checkout summary QA
3. Fill manual QA worksheet `#10` to `#16`
4. If deployment exists, fill live worksheet `#16` to `#18`
5. Final review and commit

## Blockers To Watch

- Aggregate `/actuator/health` is locally `503` because mail health is not configured, even though liveness/readiness are both `200`
- Live deployment worksheet cannot be closed without real HTTPS host
- Some existing docs may still describe old gaps from before the implementation pass
