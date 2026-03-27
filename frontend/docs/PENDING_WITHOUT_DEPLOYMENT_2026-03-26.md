# Pending Without Deployment - 2026-03-26

Status date: 2026-03-26  
Scope: Local code + local build/test verifiable items only

## Snapshot

- Completed buckets: 18
- Partially complete buckets: 0
- Pending buckets: 0

## Backbone Status

| Backbone | Status | Notes |
| --- | --- | --- |
| Tax rules configurable | Complete | Admin tax-rule + HSN management flows and seller GST/HSN preview are present. |
| Order snapshot immutable | Complete | Backend freeze logic exists; frontend settlement/order views consume frozen snapshot values. |
| Seller communication center | Complete | Backend APIs + frontend API switch-over + seller/admin drawer navigation entry are in place. |

## Completed (No Deployment Required)

1. Admin tax rule configuration UI with publish flow.
2. HSN master configuration UI with publish flow.
3. Seller add-product GST/HSN resolution + pricing preview.
4. Seller manual HSN override review queue in admin.
5. Frozen tax snapshot visibility in order detail views.
6. Settlement view using commission/commission GST/TCS from snapshot-backed records.
7. Seller aftercare screens showing snapshot-based adjustment context.
8. Admin compliance notes center (create/edit/publish/archive, attachment support, auto-draft helper).
9. Seller compliance notes list/detail with latest/unread/archived tabs and read/unread tracking.
10. Backend compliance notes APIs (`CRUD`, `publish/archive`, `read/unread`, seller unread count).
11. Compliance note attachment hardening (HTTPS-only URL validation, host allowlist, max-count/length guard, auth-protected download redirect endpoints).
12. Effective-date enforcement in seller product/order flows (future-date guardrails + effective GST rule gating at preview and order snapshot freeze).
13. Seller communication center backend integration (frontend now calls backend notes APIs for list/detail/read/unread/acknowledgment/count).
14. Product-level impact summary per compliance note.
15. Seller acknowledgment flow (separate from read/unread tracking).
16. Advanced compliance analytics view with backend + frontend filters (type/date/min impacted sellers).
17. Return/refund/exchange adjustment drill-down UI in seller aftercare routes.
18. Auto-draft backend event trigger on tax/HSN rule lifecycle updates.
19. Snapshot ownership visibility in customer order details (invoice owner + liability owner rendered in the frozen snapshot card block).
20. Notes navigation drawer-entry integration merged directly in `src/features` seller/admin drawer files (no bridge, no override layer).

## Partial / In Progress

- None.

## Pending (No Deployment Dependency)

- None.

## Practical Summary

- Your 3-priority backbone is now `3 complete`.
- Remaining non-deployment backlog is empty from a functional perspective.
