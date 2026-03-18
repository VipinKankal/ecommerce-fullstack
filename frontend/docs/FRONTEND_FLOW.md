# Frontend Flow

## 1. Frontend Architecture Summary
The frontend is a React single-page application structured around role-based modules and Redux-managed API state.

Primary architecture layers:
- App shell and routing
- Feature modules
- Shared UI/components
- Redux state and async thunks
- API integration layer

Key technologies:
- React
- React Router
- Redux Toolkit
- Material UI
- Tailwind/CSS utility styling in many screens

## 2. App Shell and Route Ownership
Top-level routes are defined in `src/App.tsx`.

### Public / customer-facing routes
- `/`
- `/login`
- `/products/:category`
- `/product-details/:categoryId/:name/:productId`
- `/checkout/*`
- `/payment-success/:paymentOrderId`
- `/payment-cancel`
- `/account/*`
- `/wishlist`

### Role-specific routes
- `/seller/*`
- `/admin/*`
- `/courier/login`
- `/courier/dashboard`

### App bootstrap behavior
The app checks runtime token and auth role to bootstrap one of the following profiles when needed:
- customer profile
- seller profile
- admin profile

Protected-like user flows currently rely on route-aware bootstrap logic and persisted session auth data.

## 3. Redux / Async Data Flow
The frontend uses Redux Toolkit async thunks to manage server communication.

Broad responsibilities of frontend state:
- Authentication and profile data
- Cart state
- Product data
- Seller data
- Admin data
- Master API responses for orders, payments, and system views
- Wishlist state

Important thunk groups include:
- customer auth/profile thunks
- cart thunks
- backend master thunks for orders/payments/admin data
- seller thunks for seller orders/products/auth
- wishlist thunks

## 4. Customer Frontend Flow

### 4.1 Browse and discovery
Customer starts from home and category pages.

Key pages:
- Home
- Product list by category
- Product details
- Reviews
- Wishlist

### 4.2 Checkout flow
Main checkout component: `src/modules/customer/pages/Checkout/Checkout.tsx`

Checkout route structure:
- `/checkout/cart`
- `/checkout/address`
- `/checkout/payment`

Checkout steps:
1. BAG
2. ADDRESS
3. PAYMENT

Checkout responsibilities:
- Require active customer session or redirect to login
- Load cart items
- Select cart items
- Remove/move items to wishlist
- Apply coupon
- Load saved addresses
- Save new address
- Build order summary from address details
- Choose payment method
- Create final checkout order

### 4.3 Payment flow
Current customer payment options in UI:
- COD
- PhonePe / UPI redirect flow

Frontend behavior:
- If backend responds with payment URL, browser redirects.
- If backend responds with created order id, customer is taken to account order details.

### 4.4 Account area
Main account shell: `src/modules/customer/pages/Account/Account.tsx`

Current account sections:
- Orders
- Profile
- Addresses
- Delete Account

### 4.5 Order list
Main file: `src/modules/customer/pages/Account/Orders.tsx`

Capabilities:
- Poll and refresh order history
- Search orders
- Filter by status
- Open order detail page

### 4.6 Order details
Main file: `src/modules/customer/pages/Account/OrderDetails.tsx`

Capabilities:
- Load order by id
- Load item details when needed
- Show customer-facing mapped status
- Show payment chip
- Show address and delivery promise
- Show stepper and milestone cards
- Show delivery history
- Show courier card
- Show cancel flow for eligible statuses

### 4.7 Wishlist and profile
Customer can manage wishlist and personal details using separate feature modules and state slices.

## 5. Seller Frontend Flow
Seller routes are mounted under `/seller/*`.

Main sections:
- Dashboard
- Products
- Add Product
- Orders
- Payments
- Transactions
- Account/Profile

Current seller-side frontend responsibilities:
- Maintain seller data
- Manage seller product catalog
- View seller orders
- Trigger seller order status updates
- View seller financial information

## 6. Admin Frontend Flow
Admin routes are mounted under `/admin/*`.

Main sections:
- Dashboard / Overview
- Sellers
- Users
- Products
- Orders
- Transactions
- Manual UPI
- Couriers
- Reports
- Account
- Coupon management
- Home/deal management sections

Current admin-side frontend role is largely monitoring and control-oriented rather than customer-journey-oriented.

## 7. Courier Frontend Flow
Main courier screen: `src/modules/courier/pages/CourierDashboard.tsx`

Current tabs in repo baseline:
- Deliveries
- Delivered Orders
- COD
- Petrol
- Earnings

Current courier flow supports:
- Assigned task list
- Task detail dialog
- Delivery status selection
- COD collection amount and mode capture
- UPI screenshot upload for COD-online mode
- Send delivery OTP
- Verify OTP
- Final delivery completion
- COD deposit submission
- Petrol claim submission
- Earnings visibility

### Delivery confirmation logic
Courier flow is stricter than a simple delivered toggle.

Typical sequence:
1. Task accepted / progressed
2. Courier reaches customer location
3. OTP is sent to customer email
4. Courier collects OTP from customer
5. OTP is verified
6. Delivery is completed

This is one of the most operationally mature flows currently present in the frontend.

## 8. Frontend Status Mapping Logic
Customer order statuses are not always shown exactly as raw backend values.

Frontend derives display status using combinations of:
- `orderStatus`
- `shipmentStatus`
- `deliveryTaskStatus`
- sometimes `fulfillmentStatus`

This means UX-facing status badges are a computed view rather than a direct backend echo.

## 9. Frontend Strengths in Current Repo
Strongly implemented areas:
- Checkout flow
- Account order tracking UI
- Courier delivery workflow
- Role-based route separation
- Admin and seller dashboards

## 10. Frontend Gaps / Pending Areas
Likely next areas for deeper expansion:
- Return/exchange UI for customer
- Reverse pickup flow in courier workspace
- Admin approval flow for return/exchange
- Invoice and billing UX
- Standardized warehouse-specific UI

## 11. Recommended Use of This Document
Use this file when you need to answer:
- Which screen owns which business step?
- Which route should a new feature plug into?
- Which role-facing module already exists?
- Where customer, seller, admin, or courier work currently happens in the UI?
