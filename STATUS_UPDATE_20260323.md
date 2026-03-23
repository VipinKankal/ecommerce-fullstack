# Consolidated Status Update (2026-03-23)

Branch: `main`
Commit: `cf36c9a1711246c45eb578e9e70a883de0dfea73`

## Verified Complete
- `#19` Baseline Verification: `npm run typecheck` passes.
- `#20` Baseline Verification: `npm run test:ci` passes.
- `#21` Baseline Verification: `npm run build` passes.
- `#34` Frontend Lint: `selectedVariant` issue no longer present in current frontend build/typecheck path.
- `#35` Frontend Lint: `loadLogs` dependency issue no longer present in current frontend build/typecheck path.
- `#36` Frontend Test: `App.test.tsx` now passes.
- `#37` Backend Test: `EcommerceApplicationTests` passes.
- `#38` Backend Test: `SecurityIntegrationTests` passes.

## Implemented In This Batch (QA Still Needed)
- `#1` Backend Contract: auth cookie set on signup/signin responses.
- `#2` Backend Contract: logout endpoint added and auth cookie clear wired.
- `#3` Backend Contract: `/api/auth/users/profile` now accepts cookie-auth without Bearer.
- `#4` Backend Contract: `/sellers/profile` now accepts cookie-auth without Bearer.
- `#5` Backend Contract: CORS credentials remain enabled for configured frontend origins.
- `#6` Backend Contract: CSRF cookie/header strategy wired as `XSRF-TOKEN` + `X-CSRF-Token`.
- `#12` Testing Checklist: frontend bootstrap updated toward cookie-backed refresh on protected routes.
- `#13` Testing Checklist: logout path now clears auth cookie server-side.
- `#14` Testing Checklist: customer protected controllers now accept cookie session instead of requiring Bearer header.
- `#15` Testing Checklist: seller protected controllers now accept cookie session instead of requiring Bearer header.

## Still Pending
- `#7` Frontend Follow-up: centralized 401 handling.
- `#8` Frontend Follow-up: global profile-bootstrap loading guards.
- `#9` Frontend Follow-up: unauthenticated cart/add-to-cart 401 UI handling.
- `#10` Testing Checklist: customer OTP login cookie + profile success needs explicit QA/test coverage.
- `#11` Testing Checklist: seller OTP login cookie + profile success needs explicit QA/test coverage.
- `#16` Deployment Checklist: frontend + backend HTTPS deployment.
- `#17` Deployment Checklist: production cookie flags verification.
- `#18` Deployment Checklist: production CORS restriction to trusted domains.
- `#22` Baseline Verification: oversized `.ts/.tsx` files still present.
- `#23` Baseline Snapshot: branch/SHA not yet captured in release notes artifact.
- `#24` Baseline Snapshot: command outputs not yet captured in release notes artifact.
- `#25` Baseline Snapshot: not marked as no-behavior-change baseline.
- `#26` Migration Guardrails: wrapper-based migrations only.
- `#27` Migration Guardrails: route contract change note discipline.
- `#28` Migration Guardrails: API contract change coordination discipline.
- `#29` Migration Guardrails: feature-by-feature compile-safe PR slicing.
- `#30` PR Gate Criteria: scope statement.
- `#31` PR Gate Criteria: proof bundle for typecheck/test/build.
- `#32` PR Gate Criteria: critical-flow risk note.
- `#33` PR Gate Criteria: rollback path.

## Current Counts
- Verified complete: `8`
- Implemented, QA pending: `10`
- Still pending: `20`
