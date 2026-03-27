# Backend Flow - Compliance + Tax Spine

Status date: 2026-03-26

## Core Flow

1. Seller onboarding captures tax/compliance identity state.
2. Admin maintains tax rule versions (GST/TCS) and HSN mapping versions.
3. Seller product draft requests tax preview from active rule versions.
4. System resolves HSN + GST class and computes payout preview fields.
5. Seller publishes product; rule/version references are attached.
6. Customer order creation determines supply type and place-of-supply branch.
7. Order tax snapshot freeze persists immutable values:
`hsn`, `tax class`, `gst`, `commission`, `commission gst`, `tcs`, `rule versions`.
8. Payment capture posts gross amount.
9. Settlement posting computes seller payable from frozen snapshot.
10. Ledger rows are generated for reconciliation.
11. Returns/refunds/exchanges create adjustment entries against original snapshot.
12. Original snapshot remains unchanged; only adjustments mutate totals.

## Compliance Communication Flow

1. Compliance update enters admin workflow (manual today, event-driven next).
2. Seller-facing note is created as draft.
3. Admin reviews wording, attachments, effective date, and required action.
4. Note is published for seller consumption.
5. Seller reads note; read/unread state is recorded.
6. Archived notes remain traceable for historical audits.

## Implementation Status

- Implemented:
Tax rule + HSN management, seller preview flow, snapshot-backed settlement/aftercare visibility.
- Implemented:
Compliance notes persistence APIs for admin CRUD + publish/archive and seller read/unread.
- Implemented:
Attachment policy hardening with HTTPS-only + host allowlist validation and role-protected download redirect endpoints.
- Implemented:
Effective-date enforcement for seller product preview and order snapshot freeze (future-date guard + mandatory effective GST resolution).
- Implemented:
Frontend API switch-over to backend endpoints and event-driven auto-draft generation from tax/HSN rule changes.
- Implemented:
Seller/admin notes navigation drawer entry wiring directly in feature drawer modules.
