# Security Hardening Changelog

## Date
- 2026-03-03

## Scope Covered
- Admin, Seller, User auth/profile flows
- Product, SellerProduct, SellerOrder, Orders
- Coupon, Cart, Wishlist, Reviews, Transactions, Payment
- JWT/auth security + OTP flow hardening
- Build/test warning cleanup

## Key Changes

### Auth, Roles, Access Control
- Enabled and used method-level role guards (`@PreAuthorize`) across sensitive controllers.
- Seller endpoints split correctly by access:
  - Public: seller signup/login/verify-email
  - Seller-only: profile/update/report
  - Admin-only: seller list/get-by-id/delete/status
- Order read protection added:
  - Customer can fetch only own orders/order-items
  - Admin override retained
- Seller ownership enforced for:
  - Seller product update/delete
  - Seller order status update
- Transactions endpoint normalized and secured:
  - `/api/transactions/seller` => seller-only
  - `/api/transactions` => admin-only

### Data Exposure & Logging
- Removed sensitive debug logs (OTP/JWT prints) from controllers/services where present.
- Password serialization protections retained (`WRITE_ONLY` on sensitive fields).

### OTP & Authentication Hardening
- OTP lifecycle protections added/used:
  - expiry window
  - max attempts
  - consumed/deletion handling
  - per-email rate-limit style controls in auth flow
- JWT Bearer header format validation strengthened in token parsing paths.

### API Contract & Validation Improvements
- Replaced unsafe entity update patterns with safer DTO usage where needed.
- Added request validation (`@Valid`) and constraints for:
  - cart add/update requests
  - review create/update requests
- Review service fixes:
  - rating validation (1 to 5)
  - correct productImages mapping from request

### Coupon/Cart Security Logic
- Coupon apply no longer trusts client-provided order value.
- Coupon validation now uses server cart totals and validity date checks.
- Coupon remove/apply cart calculations and persistence hardened.

### Payment Flow Security
- Payment callback protected to authenticated customer/admin roles.
- Payment callback enforces user ownership of payment order.
- Payment processing validates payment-link mapping before status update.

### Build/Dependency Hygiene
- Removed duplicate `stripe-java` dependency entries.
- Added Bean Validation provider via `spring-boot-starter-validation`.
- Excluded duplicate `android-json` transitive dependency from test starters to remove duplicate `org.json` warning.
- Surefire argLine updated for JDK agent/runtime test warnings (`-XX:+EnableDynamicAgentLoading -Xshare:off`).

### Runtime Configuration
- Disabled Open Session in View:
  - `spring.jpa.open-in-view=false`

## Verification Executed
- Compile: `./mvnw.cmd -DskipTests compile` => SUCCESS
- Test: `./mvnw.cmd test` => SUCCESS
- Post-fix warnings cleaned:
  - duplicate Stripe dependency warning => resolved
  - missing Bean Validation provider warning => resolved
  - duplicate org.json warning => resolved
  - open-in-view warning => resolved
  - JVM CDS test warning => resolved

## Notes
- `application.properties` still contains local plaintext DB/mail credentials; production should move secrets to environment/secret manager.
- JAVA_HOME machine-level persistence may require admin shell; session-level Java setup works and build/test pass.
