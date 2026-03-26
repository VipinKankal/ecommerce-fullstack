# GST / TAX Flow Map - 2026-03-26

## Scope

This document maps the current GST / tax usage visible in the frontend workspace.

It covers:
- seller onboarding and seller profile tax identity capture
- seller product tax metadata capture and preview
- checkout tax breakup rendering
- seller payout and ledger visibility
- return / exchange tax adjustment visibility
- admin GST / TCS compliance reporting
- supporting docs and API touchpoints

Primary tracker source:
- `docs/GST_TAX_EXECUTION_WORKSHEET.md`

## High-Level End-To-End Flow

1. Seller onboarding captures GST identity.
   - Seller signup requires GSTIN and GST certificate upload.
   - Seller profile also keeps GST number and GST certificate editable / visible.

2. Seller product creation captures tax metadata.
   - Add Product requires `hsnCode`, `pricingMode`, `taxClass`, `taxRuleVersion`, and `taxPercentage`.
   - The seller UI computes a local GST / commission / receivable preview before submit.

3. Checkout asks backend for order summary.
   - Frontend posts shipping data to the order summary endpoint.
   - Response is normalized into `priceBreakdown` / `taxBreakdown`.
   - Checkout UI renders taxable amount, CGST, SGST, IGST, and total tax.

4. Order placement creates an immutable backend snapshot.
   - Frontend creates checkout order.
   - Workspace docs say backend freezes order tax data into `order_tax_snapshots`.
   - Frontend uses the downstream settlement and aftercare APIs that depend on this frozen snapshot.

5. Seller payout pages consume tax snapshot outputs.
   - Seller settlements show gross collection, commission, commission GST, TCS, seller payable amount, and seller GST liability.
   - Seller ledger pages expose posting trail for reconciliation.

6. Return / exchange aftercare exposes tax deltas.
   - Seller return and exchange screens display tax adjustment summaries and GST delta visibility.

7. Admin compliance reporting aggregates the settlement outputs.
   - Admin Reports shows GST payable, TCS payable, commission GST, seller GST memo, ledger summaries, and challan records.
   - CSV export is available for settlement, ledger, and challan datasets.

## Role-Wise Usage Map

### 1. Seller Onboarding And Tax Identity

Frontend capture:
- `src/features/customer/pages/BecomeSeller/SellerAccountForm.tsx`
  - validates GSTIN format
  - requires GST certificate in KYC step
  - submits `GSTIN`, `businessDetails.gstNumber`, and `kycDetails.gstCertificateUrl`
- `src/features/customer/pages/BecomeSeller/BecomeSellerFormStep2.tsx`
  - GST Number field
- `src/features/customer/pages/BecomeSeller/BecomeSellerFormStep5.tsx`
  - GST Certificate upload field
- `src/features/customer/pages/BecomeSeller/types.ts`
  - seller form shape includes `gstin`, `businessDetails.gstNumber`, `kycDetails.gstCertificateUrl`
- `src/State/features/seller/auth/SellerAuthThunks.ts`
  - `registerSeller`
  - `fetchSellerProfile`
  - `updateSellerProfile`

Seller profile maintenance:
- `src/features/seller/profile/hooks/useSellerProfile.ts`
  - maps profile GST fields into form
  - validates GST number before save
  - submits `GSTIN`, `businessDetails.gstNumber`, `kycDetails.gstCertificateUrl`
- `src/features/seller/profile/components/SellerProfileFormSections.tsx`
  - shows GST Number and GST Certificate URL
- `src/shared/types/seller.types.ts`
  - seller shape includes `GSTIN`, `businessDetails.gstNumber`, `kycDetails.gstCertificateUrl`

Admin visibility of seller GST identity:
- `src/features/admin/Pages/Sellers/SellersTable.tsx`
  - normalizes GSTIN from seller payload
  - search includes GST
- `src/features/admin/Pages/Sellers/components/SellerDetailsDialog.tsx`
  - shows GST and GST certificate URL

### 2. Seller Product Tax Metadata And Preview

Defaults and validation:
- `src/features/seller/products/pages/addProductConfig.ts`
  - defaults `pricingMode = INCLUSIVE`
  - defaults `taxClass = APPAREL_STANDARD`
  - defaults `taxRuleVersion = AUTO_ACTIVE`
  - defaults `taxPercentage = 18`
- `src/features/seller/products/pages/addProductValidation.ts`
  - requires `hsnCode`
  - requires `taxClass`
  - requires `taxRuleVersion`
  - requires `taxPercentage`

UI and local preview:
- `src/features/seller/products/pages/components/AddProductFormBody.tsx`
  - computes `taxableValue`
  - computes `gstAmount`
  - computes `finalCustomerPrice`
  - computes `commissionGst`
  - computes `netReceivable`
  - shows `GST / Profit Preview`
  - shows slab hint and rule badge

Submit path:
- `src/features/seller/products/pages/AddProductsPage.tsx`
  - sends `hsnCode`, `pricingMode`, `taxClass`, `taxRuleVersion`, `taxPercentage`
  - sends selling / MRP / commission inputs to product create API
- `src/State/features/seller/products/sellerProductThunks.ts`
  - `createProduct` posts to `/api/sellers/products`
- `src/shared/api/ApiRoutes.ts`
  - `sellerProducts.base = /api/sellers/products`

Important note:
- `src/shared/types/product.types.ts` currently does not model tax-specific fields like `hsnCode`, `taxClass`, `taxRuleVersion`, or `taxPercentage`, even though the product create flow sends them.

### 3. Checkout Tax Breakup

Order summary fetch:
- `src/features/customer/checkout/pages/CheckoutPage.tsx`
  - posts address data to `orderSummary`
  - normalizes `priceBreakdown` and `taxBreakdown`
  - reads `taxableAmount`, `cgst`, `sgst`, `igst`, `totalTax`
- `src/State/backend/masterApi/orders.ts`
  - `orderSummary` posts to `/api/orders/summary`
- `src/shared/api/ApiRoutes.ts`
  - `orders.summary = /api/orders/summary`

Display:
- `src/features/customer/checkout/components/PriceDetailsCard.tsx`
  - renders Taxable Amount
  - renders CGST / SGST / IGST
  - renders Total Tax
- `src/features/customer/checkout/utils/pricing.ts`
  - typed shape for `priceBreakdown`

Order placement:
- `src/features/customer/checkout/hooks/useCheckoutSubmit.ts`
  - submits `createCheckoutOrder`
- `src/State/backend/masterApi/orders.ts`
  - `createCheckoutOrder` posts to `/api/orders/create`

Backend snapshot dependency noted in docs:
- `docs/GST_TAX_EXECUTION_WORKSHEET.md`
  - W5 says immutable `order_tax_snapshots` are saved at order creation

### 4. Seller Payout, GST Liability, TCS, And Ledger

Settlement APIs:
- `src/State/backend/masterApi/transactions.ts`
  - `sellerSettlements`
  - `sellerSettlementLedger`
  - `adminSettlements`
  - `adminSettlementLedger`
- `src/shared/api/ApiRoutes.ts`
  - `/api/settlements/seller`
  - `/api/settlements/seller/ledger`
  - `/api/settlements`
  - `/api/settlements/ledger`

Seller payout UI:
- `src/features/seller/Pages/Transactions/Payment.tsx`
  - shows gross collected
  - shows net payable
  - shows deductions
  - shows seller GST liability
  - payout formula: `gross - commission - commission GST - TCS = net`
  - settlement table includes `commissionGstAmount`, `tcsAmount`, `sellerPayableAmount`, `sellerGstLiabilityAmount`
  - ledger table provides reconciliation trail

Raw transaction history:
- `src/features/seller/Pages/Transactions/Transaction.tsx`
  - shows customer-linked transactions
  - not GST-specific, but sits next to payout/compliance breakdown

### 5. Return / Refund / Exchange Tax Adjustments

Seller returns:
- `src/features/seller/Pages/Aftercare/SellerReturnRequests.tsx`
  - fetches `/api/seller/aftercare/returns`
  - shows `taxAdjustment`
  - displays note type, posting status, GST delta, seller payable delta, summary

Seller exchanges:
- `src/features/seller/Pages/Aftercare/SellerExchangeRequests.tsx`
  - fetches `/api/seller/aftercare/exchanges`
  - shows `taxAdjustment.netDelta`
  - displays GST delta and seller payable delta

API routes:
- `src/shared/api/ApiRoutes.ts`
  - `sellerAftercare.returns`
  - `sellerAftercare.exchanges`

### 6. Admin GST / TCS Reporting And Challans

Admin report UI:
- `src/features/admin/Pages/Dashboard/AdminReports.tsx`
  - loads sales report
  - loads settlement dataset
  - loads settlement ledger
  - loads compliance challans
  - computes totals for:
    - commission GST
    - TCS
    - admin GST
    - seller GST memo
    - payout reserve
    - challan paid amount
  - exports:
    - `gst-tcs-settlements.csv`
    - `gst-tcs-ledger.csv`
    - `gst-tcs-challans.csv`
  - creates challans via `POST /api/admin/compliance/challans`

Supporting data fetch:
- `src/State/backend/masterApi/admin.ts`
  - `adminSalesReport`
- `src/State/backend/masterApi/transactions.ts`
  - admin settlement and ledger thunks
- `src/shared/api/ApiRoutes.ts`
  - `admin.salesReport = /api/admin/reports/sales`

### 7. Documentation References

Primary GST tracker:
- `docs/GST_TAX_EXECUTION_WORKSHEET.md`
  - W2 GSTIN verification workflow
  - W3 tax rule version engine
  - W4 seller GST / profit preview UI
  - W5 order tax snapshot freeze
  - W6 checkout tax breakup UI
  - W7 seller payout breakdown
  - W8 return / refund / exchange tax adjustments
  - W9 GST / TCS admin reporting
  - W10 challan / export pack

Schema-oriented note:
- `docs/PROJECT_DOCUMENTATION_HI.md`
  - product table notes include `tax_percentage`

## API Touchpoints In Current Frontend

- `/sellers`
- `/sellers/profile`
- `/api/sellers/products`
- `/api/orders/summary`
- `/api/orders/create`
- `/api/settlements/seller`
- `/api/settlements/seller/ledger`
- `/api/settlements`
- `/api/settlements/ledger`
- `/api/seller/aftercare/returns`
- `/api/seller/aftercare/exchanges`
- `/api/admin/reports/sales`
- `/api/admin/compliance/challans`

## Gaps / Notable Observations

- The GST execution worksheet still shows `W1 Compliance matrix sign-off` as pending.
- Checkout visibly renders tax breakup, but customer order detail screens do not currently appear to render GST rows directly.
- Product create flow carries rich tax metadata, but shared product typings do not currently expose those tax fields.
- Admin compliance challan routes are used directly inside `AdminReports.tsx` instead of via `API_ROUTES`.
