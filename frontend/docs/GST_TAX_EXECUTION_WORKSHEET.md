# GST/TAX Execution Worksheet

Date: 2026-03-25
Owner: ____________________
Environment: ____________________
Branch/Commit: ____________________

## Tracker

| ID | Task | Priority | Dependency | Status | Evidence |
|---|---|---|---|---|---|
| W1 | Compliance matrix sign-off | P0 | None | Pending | Signed doc |
| W2 | GSTIN verification workflow | P0 | W1 | Completed | GSTIN format/checksum/ACTIVE gate wired in onboarding and seller update flow |
| W3 | Tax rule version engine | P0 | W1 | Completed | Effective-date GST/TCS rule engine + admin/seller resolve APIs + seed rule versions |
| W4 | Seller GST/profit preview UI | P1 | W3 | Completed | Seller add-product preview implemented with validation + rule badge |
| W5 | Order tax snapshot freeze | P0 | W3 | Completed | Immutable `order_tax_snapshots` record saved at order creation with GST/TCS totals + response exposure |
| W6 | Checkout tax breakup UI | P1 | W5 | Completed | Tax rows wired with robust payload parsing + fallback keys |
| W7 | Seller payout breakdown UI | P1 | W7-backend | Completed | Seller payments page now shows gross, deductions, GST liability, settlement rows, and ledger entries from live settlement APIs |
| W7-backend | Settlement + ledger service | P0 | W5 | Completed | Payment success now posts immutable settlement + ledger entries via `SettlementLedgerService`; seller/admin settlement APIs and V26 migration added |
| W8 | Return/refund/exchange tax adjustments | P1 | W5, W7-backend | Completed | Aftercare responses now include computed credit/debit-note style tax adjustment summaries and seller aftercare UI shows GST/net delta visibility |
| W9 | GST/TCS admin reporting | P1 | W7-backend | Completed | Admin Reports page now shows GST payable, TCS payable, settlement filing dataset, and ledger account summaries from live settlement APIs |
| W10 | Challan/payment + export pack | P2 | W9 | Completed | Admin compliance challan records are persisted and Admin Reports can export settlement, ledger, and challan CSV packs |

## Assumptions Locked

- Pricing mode default: `Inclusive`
- Marketplace liability: seller GST, admin commission GST + TCS
- Seller onboarding: only GST ACTIVE sellers
- Rule strategy: effective-dated versioning mandatory

## Notes

- Frontend implementation slice for W4 and W6 is completed in current workspace.
- Backend implementation slice for W2, W3, and W5 is completed in current workspace.
- Backend verification is partially blocked locally because Maven wrapper needs network access and `JAVA_HOME` was not preconfigured in the shell.



