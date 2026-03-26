# GST / TAX Frontend-Backend Cross-Check - 2026-03-26

## Summary

The GST / tax system is partially aligned across frontend and backend, but there are a few important gaps.

Big picture:
- Seller GST identity capture is aligned.
- Product create path is mostly aligned.
- Order tax snapshot, settlement, aftercare adjustment, and admin compliance APIs exist in backend and are consumed in frontend.
- The biggest mismatch is checkout tax preview: frontend expects tax breakup fields, but the current backend summary contract does not provide them.

## Confirmed Alignments

### 1. Seller GST Identity Flow Is Aligned

Frontend:
- `src/features/customer/pages/BecomeSeller/SellerAccountForm.tsx`
- `src/features/customer/pages/BecomeSeller/BecomeSellerFormStep2.tsx`
- `src/features/customer/pages/BecomeSeller/BecomeSellerFormStep5.tsx`
- `src/features/seller/profile/hooks/useSellerProfile.ts`

Backend:
- `../backend/src/main/java/com/example/ecommerce/seller/request/SellerSignupRequest.java`
- `../backend/src/main/java/com/example/ecommerce/seller/request/SellerUpdateRequest.java`
- `../backend/src/main/java/com/example/ecommerce/seller/service/impl/SellerServiceImpl.java`
- `../backend/src/main/java/com/example/ecommerce/seller/service/impl/GstinVerificationServiceImpl.java`

What matches:
- GSTIN is captured in onboarding and seller profile edit flow.
- GST certificate is captured in frontend KYC flow and persisted by backend.
- Backend normalizes GSTIN, validates checksum, and enforces ACTIVE GST registration.

### 2. Product Tax Metadata Create Path Is Aligned

Frontend:
- `src/features/seller/products/pages/AddProductsPage.tsx`
- `src/features/seller/products/pages/addProductConfig.ts`
- `src/features/seller/products/pages/addProductValidation.ts`

Backend:
- `../backend/src/main/java/com/example/ecommerce/catalog/request/CreateProductRequest.java`
- `../backend/src/main/java/com/example/ecommerce/catalog/service/impl/ProductServiceImpl.java`

What matches:
- Frontend sends `hsnCode`, `pricingMode`, `taxClass`, `taxRuleVersion`, `taxPercentage`, `costPrice`, `platformCommission`, `currency`.
- Backend create flow accepts and persists those fields.

### 3. Order Tax Snapshot, Settlement, And Aftercare Infrastructure Exists

Backend:
- `../backend/src/main/java/com/example/ecommerce/order/service/impl/OrderServiceImpl.java`
- `../backend/src/main/java/com/example/ecommerce/order/service/impl/OrderTaxSnapshotServiceImpl.java`
- `../backend/src/main/java/com/example/ecommerce/order/service/impl/SettlementLedgerServiceImpl.java`
- `../backend/src/main/java/com/example/ecommerce/order/service/impl/OrderAftercareTaxAdjustmentService.java`

Frontend consumers:
- `src/features/seller/Pages/Transactions/Payment.tsx`
- `src/features/seller/Pages/Aftercare/SellerReturnRequests.tsx`
- `src/features/seller/Pages/Aftercare/SellerExchangeRequests.tsx`
- `src/features/admin/Pages/Dashboard/AdminReports.tsx`

What matches:
- Backend freezes tax snapshot during order creation.
- Backend posts settlement and ledger records after successful payment.
- Frontend settlement, aftercare, and admin compliance views consume those downstream APIs.

## Contract Gaps And Risks

### P0. Checkout Tax Breakup UI Does Not Match Backend Summary Contract

Frontend expectation:
- `src/features/customer/checkout/pages/CheckoutPage.tsx`
- `src/features/customer/checkout/components/PriceDetailsCard.tsx`
- Frontend tries to read:
  - `taxableAmount`
  - `cgst`
  - `sgst`
  - `igst`
  - `totalTax`
  - optional `taxBreakdown`

Backend reality:
- `../backend/src/main/java/com/example/ecommerce/order/response/CheckoutOrderSummaryResponse.java`
- `../backend/src/main/java/com/example/ecommerce/order/controller/OrderController.java`

Confirmed mismatch:
- Backend `CheckoutOrderSummaryResponse.PriceBreakdown` currently contains only:
  - `platformFee`
  - `totalMRP`
  - `totalSellingPrice`
  - `totalDiscount`
- No `taxBreakdown`
- No `taxableAmount`
- No `cgst`, `sgst`, `igst`, or `totalTax`

Additional mismatch:
- Frontend posts address details to `orderSummary`.
- Backend `POST /api/orders/summary` currently does not accept request body input for address-driven tax preview.
- That means supply-type-sensitive preview like intra-state vs inter-state cannot currently be calculated in summary.

Impact:
- Checkout tax rows will stay blank.
- `W6 Checkout tax breakup UI` is not fully supported by the current backend contract.
- `docs/GST_TAX_EXECUTION_WORKSHEET.md` appears ahead of the actual checkout summary response contract.

### P1. Backend Tax Rule Engine Exists, But Frontend Does Not Use It

Backend available:
- `../backend/src/main/java/com/example/ecommerce/seller/controller/SellerTaxRuleController.java`
- `../backend/src/main/java/com/example/ecommerce/admin/controller/AdminTaxRuleController.java`
- `../backend/src/main/java/com/example/ecommerce/tax/service/impl/TaxRuleVersionServiceImpl.java`
- `../backend/src/main/java/com/example/ecommerce/tax/request/ResolveTaxRuleRequest.java`
- `../backend/src/main/java/com/example/ecommerce/tax/response/TaxRuleResolutionResponse.java`

Frontend current behavior:
- `src/features/seller/products/pages/components/AddProductFormBody.tsx`
- `src/features/seller/products/pages/addProductConfig.ts`
- No frontend API route or thunk usage for tax-rule resolve / admin tax-rule management

Confirmed mismatch:
- Backend can resolve GST/TCS using:
  - `ruleType`
  - `taxClass`
  - `hsnCode`
  - `supplyType`
  - `taxableValue`
  - `effectiveDate`
- Frontend seller preview currently relies on:
  - static defaults
  - local arithmetic
  - a heuristic slab hint
- Frontend does not call `/api/sellers/tax-rules/resolve`
- Frontend does not expose `/api/admin/tax-rules`

Impact:
- Seller preview can diverge from real active tax rule versions.
- Rule changes or effective-date changes will not be reflected in frontend preview until manual code changes.
- Admin tax-rule operations are backend-only right now.

### P1. Product Tax Fields Are Supported By Backend But Under-Modeled In Frontend

Backend supports these in request/response:
- `../backend/src/main/java/com/example/ecommerce/catalog/request/CreateProductRequest.java`
- `../backend/src/main/java/com/example/ecommerce/catalog/request/UpdateProductRequest.java`
- `../backend/src/main/java/com/example/ecommerce/catalog/response/ProductResponse.java`

Fields supported by backend:
- `hsnCode`
- `pricingMode`
- `taxClass`
- `taxRuleVersion`
- `taxPercentage`
- `costPrice`
- `platformCommission`
- `currency`

Frontend issues:
- `src/shared/types/product.types.ts` does not include those tax fields.
- `src/features/seller/products/components/productsTable/ProductEditDialog.tsx` does not let seller edit them.
- `src/features/seller/products/components/ProductsTable.tsx` does not surface them in table workflows.

Impact:
- Seller can create tax-rich product data, but frontend typing does not fully preserve or expose it after fetch.
- Editing existing product tax metadata is not supported in current seller UI even though backend update request supports it.

### P1. Frozen Order Tax Snapshot Exists In Backend But Is Not Surfaced In Customer Or Seller Order UI

Backend exposure:
- `../backend/src/main/java/com/example/ecommerce/order/response/OrderHistoryResponse.java`
- `../backend/src/main/java/com/example/ecommerce/order/response/OrderTaxSnapshotResponse.java`
- `../backend/src/main/java/com/example/ecommerce/seller/response/SellerOrderResponse.java`

Frontend gaps:
- `src/features/customer/pages/Account/orderDetailsTypes.ts`
  - `OrderLite` does not model `orderTaxSnapshot`
- `src/features/customer/pages/Account/OrderDetails.tsx`
  - no GST snapshot rendering
- `src/State/features/seller/orders/sellerOrderThunks.ts`
  - `SellerOrder` type does not model `orderTaxSnapshot`
- `src/features/seller/Pages/Orders/components/OrderDetailsDialog.tsx`
  - no tax snapshot rendering

Impact:
- Backend freeze data exists and is returned, but customer and seller cannot inspect it in the current UI.
- Post-order GST visibility is weaker than the backend contract already allows.

### P2. Seller Aftercare Contract Is Dynamic And Loosely Typed

Backend:
- `../backend/src/main/java/com/example/ecommerce/seller/controller/SellerAftercareController.java`
- returns `List<Map<String, Object>>`

Frontend:
- `src/features/seller/Pages/Aftercare/SellerReturnRequests.tsx`
- `src/features/seller/Pages/Aftercare/SellerExchangeRequests.tsx`

Observation:
- Frontend is consuming only part of a dynamic map contract.
- This is working for current fields, but there is no shared DTO-style contract boundary here.

Impact:
- Key renames or shape changes could silently break seller aftercare tax rendering.
- Type safety is weaker than in the settlement flows.

### P3. Admin Compliance Challan Route Is Hardcoded In Frontend

Frontend:
- `src/features/admin/Pages/Dashboard/AdminReports.tsx`

Backend route:
- `../backend/src/main/java/com/example/ecommerce/admin/controller/AdminComplianceController.java`

Observation:
- Frontend uses `COMPLIANCE_CHALLANS_ROUTE = '/api/admin/compliance/challans'` directly.
- That route is not centralized in `src/shared/api/ApiRoutes.ts`.

Impact:
- Low functional risk.
- Moderate maintainability risk.

## Recommended Next Fix Order

1. Fix checkout summary contract.
   - Either extend backend `CheckoutOrderSummaryResponse` with tax breakup fields
   - Or reduce frontend expectation if checkout tax preview is intentionally deferred

2. Wire frontend to backend tax rule resolve API.
   - Seller preview should use `/api/sellers/tax-rules/resolve`
   - Admin rule-management UI can be added later if needed

3. Expand frontend product typing and edit UI.
   - Add missing tax fields to `src/shared/types/product.types.ts`
   - Extend seller product edit workflows to preserve/edit tax metadata

4. Surface frozen order tax snapshot in customer and seller order details.

5. Normalize aftercare contracts and move challan route into `API_ROUTES`.

## Practical Verdict

Current repo status:
- Backend tax core is richer than frontend presentation in several places.
- The most urgent functional gap is checkout tax preview.
- The most important structural gap is that frontend still does not use the backend tax rule engine.
