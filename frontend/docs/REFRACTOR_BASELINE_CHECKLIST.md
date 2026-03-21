# Refactor Baseline Freeze Checklist

Purpose: lock a compile-safe baseline before future incremental refactors.

## 1) Baseline Verification

- [ ] `npm run typecheck` passes
- [ ] `npm run test:ci` passes
- [ ] `npm run build` passes
- [ ] No `.ts/.tsx` file above agreed size threshold

## 2) Baseline Snapshot

- [ ] Capture current branch + commit SHA in release notes
- [ ] Capture command outputs for `typecheck`, `test:ci`, `build`
- [ ] Mark this baseline as "no behavior/route/API change"

Optional tag command (run when release owner approves):

```bash
git tag -a refactor-baseline-YYYYMMDD -m "Frontend refactor safe baseline"
```

## 3) Migration Guardrails

- [ ] Wrapper-based migrations only
- [ ] No route contract changes without explicit migration note
- [ ] No API payload/response shape change without backend coordination
- [ ] Feature-by-feature PRs only (small, compile-safe steps)

## 4) PR Gate Criteria

Every refactor PR should include:

- [ ] Scope statement (what changed and what did not)
- [ ] Proof of `typecheck + test + build`
- [ ] Risk note for critical flows (checkout/order/courier)
- [ ] Rollback path (files/features to revert if needed)
