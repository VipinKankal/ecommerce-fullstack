# Clothing E-commerce Website Ki Technical Documentation

## 1. Project Overview

### Project ka Purpose
Yeh project ek **Clothing E-commerce Website / Marketplace Platform** hai jiska main purpose India me clothing products ko online bechna hai. System is tarah design kiya gaya hai ki customer easily product browse kar sake, cart me add kar sake, online payment kar sake, aur courier ke through delivery receive kar sake.

### Target Users
System ke main users 3 types ke hain:

1. **Customer**
   - products browse karta hai
   - cart me add karta hai
   - order place karta hai
   - payment karta hai
   - order track karta hai

2. **Seller**
   - apne clothing products upload karta hai
   - inventory manage karta hai
   - orders process karta hai
   - transactions aur store profile manage karta hai

3. **Admin**
   - poore platform ko monitor karta hai
   - user aur seller management karta hai
   - products, orders, payments aur reports monitor karta hai

### Business Model
Yeh project ek **Marketplace-based business model** follow karta hai:

- multiple sellers apne products bech sakte hain
- platform customer aur seller ke beech mediator ki tarah kaam karta hai
- platform commission model apply kiya ja sakta hai
- online payments collect hote hain
- courier delivery external shipping partner ke through hoti hai

---

## 2. Complete System Architecture

## 2.1 Frontend Architecture
Frontend ek **React-based SPA (Single Page Application)** hai.

### Main Layers
- UI Components
- Pages / Screens
- State Management
- API Layer
- Routing Layer

### Frontend Module Structure
- Customer Module
- Seller Module
- Admin Module
- Shared Components
- App Routes / Providers / Store

### Frontend Responsibilities
- product listing
- product details
- cart and checkout
- account pages
- seller dashboard
- admin dashboard
- payment initiation UI
- order tracking UI

---

## 2.2 Backend Architecture
Backend **Spring Boot REST API** architecture par based hai.

### Architecture Pattern
```text
Controller -> Service -> Repository -> Database
```

### Backend Responsibilities
- authentication and authorization
- business logic
- order creation
- payment handling
- seller onboarding
- admin monitoring
- data persistence
- validation and security

### Main Backend Modules
- Auth
- User
- Catalog / Product
- Order
- Payment
- Seller
- Admin
- Common / Security / Exception

---

## 2.3 Database Architecture
Database relational design par based hai aur production use-case ke liye suitable hai.

### Core Design
- user-based entities
- product catalog entities
- order and payment entities
- seller/store entities
- shipping-related data
- address and review data

### Database Responsibilities
- product data storage
- order lifecycle persistence
- payment records
- customer profile and addresses
- seller profile and KYC details

---

## 2.4 Payment Gateway Integration
System online payment support karta hai.

### Current supported / target gateways
- Razorpay
- UPI-based payments
- future extension:
  - PhonePe
  - Google Pay
  - Manual UPI QR

### Payment Integration Responsibilities
- payment order creation
- payment initiation
- payment status tracking
- payment verification
- retry handling
- transaction storage

---

## 2.5 Shipping API Integration
Shipping flow courier integration ke liye external API-based hona chahiye.

### Recommended Integration
- **Shiprocket Courier API**

### Responsibilities
- order pickup request create karna
- courier assign karna
- AWB / tracking ID generate karna
- shipping status sync karna
- delivery updates lena

---

## 3. Tech Stack Used

## Frontend
### React.js
- dynamic and component-based UI development
- SPA routing
- scalable frontend structure

### HTML
- page structure and semantic markup

### CSS
- base styling and custom layouts

### Tailwind CSS
- fast UI development
- utility-first styling
- responsive design implementation

### TypeScript
- type safety
- better maintainability
- scalable frontend architecture

### Redux Toolkit
- global state management
- auth, cart, product, order state handling

### React Router
- route management
- customer, seller, admin path handling

---

## Backend
### Spring Boot
- REST API development
- dependency injection
- modular backend architecture
- rapid enterprise-grade development

### Spring Security
- JWT authentication
- role-based access control
- protected APIs

### Spring Data JPA / Hibernate
- ORM support
- repository abstraction
- relational DB mapping

### Jakarta Validation
- request validation
- field-level validation rules

### Lombok
- boilerplate reduction
- cleaner entity, service, DTO classes

### Flyway
- database migration management
- schema versioning

---

## Database
### MySQL
- relational data storage
- transactional consistency
- suitable for orders, payments, products

---

## Payment System
### Razorpay / UPI
- India-friendly payment support
- UPI integration compatible
- payment gateway ecosystem support

### PhonePe / Google Pay
- UPI apps through payment gateway / intent flow

---

## Shipping System
### Shiprocket API
- courier partner aggregation
- pickup and shipment creation
- tracking support
- operationally suitable for Indian e-commerce

---

## Hosting
### Vercel
- frontend static hosting
- fast deployment for React frontend

### AWS
- backend, database, object storage, queue, monitoring

### Render
- simple backend deployment option for small to medium environments

---

## 4. Complete Application Flow

## Customer Flow
```text
User opens website
-> browses products
-> selects product
-> adds to cart / buy now
-> goes to checkout
-> selects or adds delivery address
-> selects payment method
-> completes UPI payment
-> order confirmation generated
-> seller processes order
-> courier pickup created
-> product shipped
-> customer receives delivery
```

### Detailed Flow
1. user homepage open karta hai
2. category / product listing browse karta hai
3. product detail page open karta hai
4. cart ya buy now flow start karta hai
5. checkout page par jata hai
6. delivery address save / select karta hai
7. payment method choose karta hai
8. backend order create karta hai
9. payment verification ke baad order confirm hota hai
10. seller fulfillment start karta hai
11. shipping API ko shipment request bheji jati hai
12. tracking ID generate hoti hai
13. order delivered hota hai

---

## 5. Payment Flow

```text
Customer checkout
-> payment gateway
-> UPI app (PhonePe / Google Pay / Razorpay UPI)
-> payment success webhook
-> backend verifies payment
-> payment status updated
-> order status updated
```

### Detailed Payment Steps
1. customer checkout confirm karta hai
2. backend payable amount calculate karta hai
3. payment order create hota hai
4. frontend payment gateway open karta hai
5. customer UPI app se pay karta hai
6. gateway success / failure callback ya webhook bhejta hai
7. backend signature / payment verify karta hai
8. transaction record save hota hai
9. payment status `SUCCESS` hone par order confirm hota hai
10. payment failure hone par retry flow available hona chahiye

### Payment Status Example
- `PENDING`
- `INITIATED`
- `SUCCESS`
- `FAILED`
- `CANCELLED`
- `REFUNDED`

---

## 6. Shipping Flow

```text
Order confirmed
-> shipping API request
-> courier assigned
-> tracking ID generated
-> pickup scheduled
-> order shipped
-> in transit
-> delivered
```

### Detailed Shipping Steps
1. order payment-confirmed hota hai
2. backend shipping provider API call karta hai
3. pickup address aur customer delivery address bheji jati hai
4. courier partner allocate hota hai
5. AWB / tracking number generate hota hai
6. seller parcel handover karta hai
7. shipment status system me update hoti hai
8. customer tracking page par dekh sakta hai

### Shipping-related Statuses
- `ORDER_CONFIRMED`
- `PICKUP_REQUESTED`
- `PICKUP_SCHEDULED`
- `SHIPPED`
- `IN_TRANSIT`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `RTO`
- `CANCELLED`

---

## 7. Database Schema

## 7.1 Users Table
### Purpose
Customers, admins, aur auth-linked identities store karne ke liye.

### Important Fields
- `id`
- `full_name`
- `email`
- `password`
- `mobile_number`
- `role`
- `account_status`
- `created_at`

---

## 7.2 Products Table
### Purpose
Main product catalog store karne ke liye.

### Important Fields
- `id`
- `title`
- `brand`
- `description`
- `short_description`
- `category_id`
- `sub_category_id`
- `mrp_price`
- `selling_price`
- `discount_percentage`
- `tax_percentage`
- `currency`
- `seller_id`
- `main_image`
- `thumbnail`
- `video_url`
- `returnable`
- `warranty_type`

---

## 7.3 Product Variants Table
### Purpose
Size, color, SKU level data store karne ke liye.

### Important Fields
- `id`
- `product_id`
- `variant_type`
- `variant_value`
- `size`
- `color`
- `sku`
- `price`
- `quantity`

---

## 7.4 Inventory Table
### Purpose
Stock management ke liye.

### Important Fields
- `id`
- `product_id`
- `stock_quantity`
- `reserved_quantity`
- `min_order_quantity`
- `max_order_quantity`
- `stock_status`
- `warehouse_location`

---

## 7.5 Orders Table
### Purpose
Placed orders store karne ke liye.

### Important Fields
- `id`
- `user_id`
- `seller_id`
- `shipping_address_id`
- `order_status`
- `payment_status`
- `total_mrp_price`
- `total_selling_price`
- `final_amount`
- `cancel_reason_code`
- `cancel_reason_text`
- `created_at`

---

## 7.6 Order Items Table
### Purpose
Ek order ke andar multiple items store karne ke liye.

### Important Fields
- `id`
- `order_id`
- `product_id`
- `variant_id`
- `quantity`
- `selling_price`
- `size`
- `color`

---

## 7.7 Payments Table
### Purpose
Payment transaction records store karne ke liye.

### Important Fields
- `id`
- `order_id`
- `customer_id`
- `seller_id`
- `payment_method`
- `payment_gateway`
- `gateway_order_id`
- `transaction_id`
- `amount`
- `payment_status`
- `created_at`

---

## 7.8 Shipping Table
### Purpose
Shipment tracking aur courier details store karne ke liye.

### Important Fields
- `id`
- `order_id`
- `courier_partner`
- `awb_number`
- `tracking_id`
- `shipping_status`
- `pickup_requested_at`
- `shipped_at`
- `delivered_at`

---

## 8. API Design

Neeche high-level REST API design diya gaya hai.

## Product APIs
### Get Products
`GET /products`

### Get Product Details
`GET /products/{productId}`

### Search Products
`GET /products/search?q=shirt`

---

## Cart APIs
### Add to Cart
`POST /api/cart/add`

### Get Cart
`GET /api/cart`

### Update Cart Item
`PUT /api/cart-item/{id}`

---

## Order APIs
### Create Order
`POST /api/orders`

### Create Order Summary
`POST /api/orders/summary`

### Get User Orders
`GET /api/orders/user/history`

### Get Order Status
`GET /api/orders/{orderId}`

### Cancel Order
`PUT /api/orders/{orderId}/cancel`

---

## Payment APIs
### Create Payment Order
`POST /api/payments/create-order`

### Retry Payment
`POST /api/payments/retry/{orderId}`

### Verify Payment
`POST /api/verify-payment`

### Manual UPI Submit
`POST /api/payments/manual-upi-qr/submit`

---

## Auth APIs
### Send OTP
`POST /api/auth/sent/login-signup-otp`

### Sign In
`POST /api/auth/signin`

### Sign Up
`POST /api/auth/signup`

### Profile
`GET /api/auth/users/profile`

---

## Seller APIs
### Seller Product Create
`POST /api/sellers/products`

### Seller Product Update
`PUT /api/sellers/products/{id}`

### Seller Orders
`GET /api/seller/orders`

### Seller Profile
`GET /sellers/profile`

---

## Admin APIs
### Dashboard Summary
`GET /api/admin/dashboard/summary`

### Users
`GET /api/admin/users`

### Sellers
`GET /sellers`

### Admin Orders
`GET /api/admin/orders`

### Admin Payments
`GET /api/admin/payments`

---

## 9. Folder Structure

## Frontend Folder Structure
```text
frontend/
  src/
    app/
      providers/
      routes/
      store/

    modules/
      customer/
        components/
        pages/
          Home/
          Product/
          ProductDetails/
          Cart/
          Checkout/
          Account/
      seller/
        Pages/
          Products/
          Orders/
          Transactions/
          Account/
      admin/
        Pages/
          Dashboard/
          Sellers/
        components/

    shared/
      api/
      components/
      theme/
      utils/

    Data/
      Category/
```

---

## Backend Folder Structure
```text
backend/
  src/
    main/
      java/
        com/example/ecommerce/
          admin/
            controller/
            request/
            response/
            service/
          auth/
            controller/
            request/
            response/
            service/
          catalog/
            controller/
            request/
            response/
            service/
          order/
            controller/
            request/
            response/
            service/
          seller/
            controller/
            request/
            response/
            service/
          user/
            controller/
            request/
            response/
            service/
          common/
            configuration/
            domain/
            exceptions/
            mapper/
            response/
            utils/
          modal/
          repository/
```

---

## Database / Migration Structure
```text
database/
  migrations/
    V1__bootstrap.sql
    V2__add_core_indexes.sql
    V3__enforce_unique_emails.sql
```

---

## Config Structure
```text
config/
  application.properties
  environment variables
  payment gateway keys
  shipping API config
  JWT config
  mail config
```

---

## 10. Security

## JWT Authentication
- backend JWT generate karta hai
- protected APIs par bearer token use hota hai
- role-based access apply hai

## HTTPS
Production me:
- frontend HTTPS par serve hona chahiye
- backend APIs HTTPS behind proxy / Nginx honi chahiye

## Input Validation
- backend DTO validation
- frontend form validation
- required fields enforce hote hain
- enum aur format checks hote hain

## Payment Verification
- gateway response ko blindly trust nahi karna chahiye
- webhook signature verify karni chahiye
- backend payment status independently validate kare

## Additional Security Practices
- CORS restriction
- rate limiting on OTP endpoints
- account status checks
- admin routes hard protection
- secrets environment variables me rakhne chahiye

---

## 11. Deployment Architecture

## Frontend Hosting
### Recommended
- **Vercel**
- static React frontend deployment
- CDN-backed asset delivery

## Backend Hosting
### Recommended
- **AWS EC2 / ECS / Elastic Beanstalk**
- ya **Render** simple deployment ke liye

## Database Hosting
### Recommended
- AWS RDS MySQL
- managed MySQL instance

## Payment Gateway Integration
- backend environment variables:
  - Razorpay keys
  - webhook secret
- callback URLs config-driven honi chahiye

## Suggested Deployment Diagram
```text
User Browser
   |
   v
Frontend (Vercel)
   |
   v
Nginx / API Gateway
   |
   v
Spring Boot Backend (AWS / Render)
   |
   +--> MySQL Database
   +--> Razorpay / UPI Gateway
   +--> Shiprocket API
   +--> Email Service
```

---

## 12. Future Improvements

1. **Inventory System**
   - stock reservation
   - auto stock release on failed payment
   - low stock alerts

2. **Analytics Dashboard**
   - seller sales analytics
   - admin GMV analytics
   - conversion aur order trends

3. **Recommendation Engine**
   - related products
   - recently viewed
   - personalized suggestions

4. **Admin Panel Enhancement**
   - product moderation
   - seller approval flow
   - refund management
   - manual payment verification

5. **Shipping Enhancement**
   - live tracking updates
   - courier SLA monitoring
   - RTO handling

6. **Payment Enhancement**
   - full webhook reconciliation
   - payment retry dashboard
   - refund automation

7. **Search Enhancement**
   - advanced search
   - filter engine
   - autocomplete

8. **Notification System**
   - SMS
   - email
   - push notifications
   - WhatsApp integration

9. **Return / Refund Module**
   - return request workflow
   - pickup scheduling
   - refund approval aur payout tracking

10. **Scalability Improvements**
    - Redis caching
    - queue-based email jobs
    - CDN media handling
    - background workers

---

## Conclusion
Yeh project ek production-oriented **clothing marketplace platform** ki strong foundation rakhta hai. Isme customer commerce flow, seller operations, admin monitoring, payment integration, aur delivery workflow ki core structure maujood hai.

Is system ko production-grade banane ke liye next important steps honge:

1. payment verification hardening
2. Shiprocket integration completion
3. DTO-first stable APIs
4. refund / return / shipping lifecycle expansion
5. observability, caching, aur deployment maturity
