# Backend Flow

## 1. Backend Architecture Summary
The backend is assumed to be a Spring Boot REST API application with role-based auth, business services, persistence, and marketplace-specific modules.

Core technologies:
- Spring Boot
- Spring Security
- JPA / Hibernate
- MySQL

Expected architecture pattern:
- Controller
- Service
- Repository
- Database

## 2. Backend Responsibilities in This Project
The backend is responsible for:
- Authentication and role resolution
- User and seller profile management
- Product catalog access
- Cart operations
- Order summary creation
- Final order creation
- Payment lifecycle handling
- Customer order history exposure
- Seller order ownership and updates
- Admin monitoring endpoints
- Courier assignment and delivery status updates

## 3. API Layer Design Seen from Frontend
The frontend is wired against route constants in `src/shared/api/ApiRoutes.ts`.

This indicates the backend exposes grouped APIs for:
- auth
- user
- admin
- coupons
- cart
- orders
- payment
- products
- reviews
- sellers
- seller products
- seller orders
- transactions
- wishlist
- admin couriers
- courier

## 4. Authentication and Role Flow
Backend must support distinct role contexts:
- Customer
- Seller
- Admin
- Courier

Frontend behavior indicates that role-specific profile endpoints exist and are used to bootstrap sessions after page reload or route entry.

Examples of expected backend behavior:
- validate session/JWT
- return current profile for active role
- reject unauthorized protected requests
- support logout and account deactivation flows

## 5. Customer Backend Flow

### 5.1 Product and catalog access
Customer-facing browse/search pages depend on backend support for:
- category/listing queries
- product search
- product by id
- reviews by product

### 5.2 Cart flow
Backend cart APIs must support:
- fetch cart
- add item
- update cart item
- delete cart item
- keep pricing values consistent with product state

### 5.3 Address and profile flow
Backend user APIs must support:
- get current profile
- add address
- update address
- delete address
- deactivate account
- email change support

### 5.4 Checkout summary flow
Before final order creation, frontend sends shipping details to summary API.
Backend must:
- validate shipping address fields
- determine current cart state
- calculate pricing
- apply fees/discounts
- return order summary and estimated delivery information when possible

### 5.5 Order creation flow
Final checkout order API receives:
- shipping address
- payment method

Backend should:
1. validate user/cart state
2. validate stock and pricing
3. create order and order items
4. create payment link/order when needed
5. return either payment URL or order id/context

### 5.6 Customer order history flow
Backend provides:
- full user order history
- order by id
- order item by id
- cancel reasons
- cancel order action

This set of APIs powers customer account order pages.

## 6. Seller Backend Flow
Seller backend responsibilities include:
- seller signup/login/profile
- seller profile update
- seller account status exposure
- seller product CRUD
- seller order listing
- seller order status update
- seller report / transaction support

From frontend wiring, seller order updates are expected to be action-based and tied to specific seller-owned order ids.

## 7. Admin Backend Flow
Admin endpoints are used for cross-platform visibility rather than a single narrow business function.

Admin backend responsibilities include:
- admin profile
- dashboard summary
- user list and status actions
- product list
- order list
- payments list
- sales reports
- seller status actions
- courier management and dispatch operations
- payroll/COD/petrol operational endpoints

Admin backend acts as the central operational control layer.

## 8. Payment Backend Flow
Payment-related APIs suggest multiple payment workflows.

Supported or planned flows inferred from frontend:
- online payment order creation
- retry payment flow
- manual UPI submission
- manual UPI verification by admin
- payment lookup by id

Backend payment responsibilities:
- create payment transaction records
- track payment state
- return redirect/payment-link info
- connect payment outcome to order state
- support COD-specific state handling

## 9. Courier Backend Flow
Courier APIs are one of the most workflow-heavy backend areas in the project.

Current courier backend responsibilities inferred from frontend:
- return courier profile
- return assigned tasks
- send delivery OTP
- accept delivery status patch updates
- track COD settlements
- accept petrol claims
- return earnings breakdown

### Delivery update requirements
Courier delivery status patch requests may include:
- status
- reason/note
- COD collected amount
- payment mode
- payment screenshot URL
- transaction id
- POD OTP
- POD proof photo URL
- failure reason

That means backend delivery update endpoints need to support richer logistics payloads, not just a simple status string.

## 10. Order Lifecycle from Backend Perspective
A typical backend order lifecycle in this project is:
1. Customer checks out.
2. Backend validates cart, address, payment method.
3. Backend creates order aggregate.
4. Payment context is created if needed.
5. Seller/admin fulfillment stage begins.
6. Shipment/courier assignment is created.
7. Courier updates delivery progression.
8. Final delivery confirmation is saved.
9. Customer order history endpoints reflect the latest state.

## 11. Data Ownership by Domain
A practical ownership split is:
- Auth domain owns session and identity
- User domain owns profile/address data
- Cart domain owns live cart state
- Order domain owns order aggregate and customer history
- Payment domain owns transaction/payment lifecycle
- Seller domain owns seller-owned product/order operations
- Admin domain owns platform-level oversight
- Courier domain owns logistics execution and reverse operational updates

## 12. Backend Areas That Need Strong Consistency
The following areas must remain consistent for frontend stability:
- order status values
- shipment status values
- courier task status values
- payment status values
- seller order state values
- order summary response shape
- checkout order response shape

If backend changes these values or payload shapes without coordination, the frontend customer status mapping and courier logic can break.

## 13. Recommended Use of This Document
Use this file when you need to answer:
- Which backend domain owns a feature?
- What type of request/response shape does the frontend expect?
- Which lifecycle stage belongs to order vs payment vs courier domains?
- Where future return/exchange APIs should be added?
