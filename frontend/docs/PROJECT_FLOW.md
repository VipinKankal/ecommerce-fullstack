# Project Flow

## 1. Project Overview
This project is a multi-vendor e-commerce marketplace where multiple sellers can list products and customers can browse, place orders, track deliveries, and manage their account from a single platform.

### Core Stack
- Frontend: React + Redux Toolkit + Material UI
- Backend: Spring Boot REST APIs
- Database: MySQL

### Core Business Roles
- Customer
- Seller
- Admin
- Courier

### Current Operational Assumption
There is no clearly separated warehouse-facing frontend module in the current repository. Most dispatch, monitoring, and fulfillment oversight is currently handled through Admin and Courier flows.

## 2. Business Model Summary
The platform works as a marketplace model:
- Customers shop from a unified storefront.
- Sellers manage their own products and seller-side orders.
- Admin oversees platform operations, payments, sellers, users, and logistics.
- Courier completes the final-mile operational workflow.

The system is designed to support:
- Product discovery
- Cart and checkout
- Payment initiation
- Order creation and tracking
- Seller order processing
- Courier-led delivery confirmation
- Customer order history and status visibility

## 3. Role Responsibilities

### Customer
Customer is the demand side of the platform.

Main responsibilities:
- Browse products
- View product details
- Add/remove items from cart
- Save addresses
- Apply coupons
- Choose payment method
- Place order
- Track order
- View order details
- Cancel eligible orders
- Manage wishlist and profile

### Seller
Seller is the supply-side business partner.

Main responsibilities:
- Maintain seller profile
- Add and update products
- View seller-side orders
- Update seller order status
- Monitor payments and transactions
- Support fulfillment readiness from seller side

### Admin
Admin is the platform operator.

Main responsibilities:
- Monitor users, sellers, products, and orders
- Review payment state and manual UPI flows
- Access courier operations area
- Manage seller status and platform reporting
- Observe overall operational health

### Courier
Courier is the logistics execution role.

Main responsibilities:
- View assigned delivery tasks
- Update delivery progression
- Handle COD collection details
- Send OTP to customer
- Verify OTP and complete delivery
- Submit COD deposits
- Submit petrol claims
- Track earnings and delivery work summary

## 4. End-to-End Marketplace Flow

### 4.1 Discovery to Product Selection
1. Customer lands on home page.
2. Customer browses category-based products.
3. Customer opens product details page.
4. Customer reviews price, media, seller/product information, and can move toward cart.

### 4.2 Cart and Checkout
1. Customer adds item(s) to cart.
2. Customer goes to checkout flow.
3. Checkout is divided into 3 steps:
   - Bag
   - Address
   - Payment
4. Customer selects existing address or creates a new address.
5. Frontend requests order summary using shipping details.
6. Customer selects payment method.
7. Frontend creates checkout order.

### 4.3 Payment and Order Creation
Possible outcomes:
- Backend returns payment link/redirect URL for online payment.
- Backend returns order id for directly created order flow such as COD or completed payment creation.

After success:
- Customer is redirected to payment gateway or order details page.
- Order becomes visible in customer order history.

### 4.4 Post-Order Operational Flow
1. Seller receives seller-side order view.
2. Admin can monitor platform-wide orders.
3. Courier assignment is created for delivery work.
4. Courier moves delivery through internal task statuses.
5. Customer sees a customer-friendly mapped status in account order history.
6. Final delivery may require OTP confirmation.

## 5. Current Implemented Flow by Module

### Customer Module
Current repository supports:
- Home / browsing
- Product listing
- Product details
- Cart and checkout
- Address management
- Wishlist
- Account profile
- Orders list
- Order details and tracking
- Early-stage cancellation

### Seller Module
Current repository supports:
- Seller dashboard
- Product management
- Add product flow
- Seller orders
- Seller payments / transactions
- Seller account/profile

### Admin Module
Current repository supports:
- Admin dashboard overview
- Seller listing
- User listing
- Product listing
- Orders monitoring
- Transactions
- Manual UPI monitoring
- Courier management area
- Reports
- Coupons and homepage management sections

### Courier Module
Current repository supports:
- Assigned deliveries
- Delivered orders
- Delivery details dialog
- Delivery status updates
- COD handling
- OTP confirmation before final delivery
- COD settlement submission
- Petrol claim submission
- Earnings view

## 6. Order Lifecycle Summary

### Customer-side lifecycle
A customer typically experiences:
- Browse
- Add to cart
- Checkout
- Payment
- Order created
- Order history visible
- Tracking visible
- Delivered or cancelled

### Operational lifecycle
Internally the order may pass through:
- Order creation
- Seller/admin fulfillment readiness
- Shipment handoff
- Courier assignment
- Pickup
- Out for delivery
- Arrival at location
- Confirmation pending
- Delivered

## 7. Payments in Current Project
Payment handling includes:
- COD
- PhonePe / payment redirect style flow
- Manual UPI support in admin flows

Important notes:
- Payment state is visible separately from order state.
- Delivery completion and payment confirmation are not always the same event.
- COD flows add operational complexity inside the courier workspace.

## 8. Customer Tracking Experience
The strongest customer post-order experience in the current frontend is the Order Details screen.

That screen combines:
- Current order status
- Payment status
- Delivery address
- Courier information
- Milestone timeline
- Delivery history
- Cancel action where allowed
- Product info block

This means the customer-facing post-purchase design is centered more around tracking visibility than invoice-centric actions.

## 9. Current Project Gaps / Evolving Areas
The following areas appear partially implemented, planned, or not yet fully standardized in the current frontend:
- Return request flow
- Exchange request flow
- Reverse logistics lifecycle
- Dedicated warehouse workflow UI
- Standardized invoice download flow
- Fully normalized return/exchange statuses across all roles

## 10. Important Assumptions for Future Work
When implementing new features, assume:
- Customer order history is the source of customer-facing truth.
- Seller dashboard is seller-operational truth for owned orders/products.
- Admin dashboard is the platform-level monitoring truth.
- Courier dashboard is the logistics execution truth.
- Reverse-logistics features should fit into the existing courier task model rather than introducing a disconnected flow.

## 11. Recommended Documentation Usage
Use this file as the top-level business reference.

For deeper detail, refer to:
- `docs/FRONTEND_FLOW.md` for UI/module/routing behavior
- `docs/BACKEND_FLOW.md` for API/service/data flow expectations
- `docs/ORDER_STATUS.md` for lifecycle and status mapping rules
