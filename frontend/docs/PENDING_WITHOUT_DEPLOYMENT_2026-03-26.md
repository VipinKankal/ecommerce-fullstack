# Pending Without Deployment - 2026-03-26

Status date: 2026-03-26  
Scope: Local code + local build/test verifiable items only

## Snapshot

- Completed buckets: 12
- Partially complete buckets: 3
- Pending buckets: 5

## Backbone Status

| Backbone | Status | Notes |
| --- | --- | --- |
| Tax rules configurable | Complete | Admin tax-rule + HSN management flows and seller GST/HSN preview are present. |
| Order snapshot immutable | Complete | Backend freeze logic exists; frontend settlement/order views consume frozen snapshot values. |
| Seller communication center | Partial | Frontend center + backend compliance notes APIs implemented; frontend wiring still local-store based and needs API switch-over. |

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

## Partial / In Progress

1. Seller communication center integration:
Backend APIs are now present, but frontend still uses local persistence and needs API wiring.
2. Navigation integration:
Routes are wired; floating shortcut entry is available.
Pending drawer-menu integration in `src/features/**` (currently write-restricted in this environment).
3. Auto draft + review:
Manual auto-draft helper is implemented.
Pending rule-update event driven draft generation from backend.

## Pending (No Deployment Dependency)

1. Invoice owner and liability owner fields surfaced in frontend snapshot cards.
2. Return/refund/exchange accounting adjustment ledger drill-down UI.
3. Seller acknowledgment (explicit "acknowledged" action separate from read/unread).
4. Product-level impact summary for each published compliance note.
5. Advanced compliance analytics view (filter by type, period, impacted sellers).

## Practical Summary

- Your 3-priority backbone is still `2 complete + 1 partial`.
- Remaining non-deployment work is mainly backend integration for seller communication notes and deeper compliance analytics.
