# Getting Started with Create React App


Architecture Map (Current Project)

1) Entry + App Bootstrap

React app start hota hai src/index.tsx
Global wrappers:
BrowserRouter
Redux Provider with src/State/Store.ts
Root component App
2) Root Routing Layer

Main routes defined in src/App.tsx
Top-level paths:
/ Home
/login
/products/:category
/product-details/:categoryId/:name/:productId
/reviews/:productId
/cart, /checkout
/become-seller
/account/* (customer nested area)
/seller/* (seller dashboard shell)
/admin/* (admin dashboard shell)
3) Nested Route Areas

Customer account nested routes in src/customer/pages/Account/Account.tsx
/account/ profile
/account/orders
/account/orders/:orderId/:orderItemId
/account/addresses
Seller nested routes in src/Routes/SellerRoutes.tsx
Admin nested routes in src/Routes/AdminRoutes.tsx
Dashboard shells:
[src/Seller/Pages/Seller Dashboard/SellerDashboard.tsx](d:/ecommerce-frontend/src/Seller/Pages/Seller Dashboard/SellerDashboard.tsx)
src/admin/Pages/Dashboard/AdminDashboard.tsx
4) State Management (Redux Toolkit)

Store + typed hooks in src/State/Store.ts
Reducers:
sellerAuth
customerAuth
sellerProduct
product
cart
5) Data/API Flow

Axios clients + JWT interceptor in src/Config/Api.ts
publicApi: public endpoints
api: token-attached endpoints
Auth thunks:
Customer: src/State/CustomerLogin/CustomerLogin.ts
Seller: src/State/Seller/SellerAuthThunks.ts
Product thunks: src/State/Customer/productThunks.ts
Cart logic: src/State/Cart/cartSlice.ts
6) Runtime Flow (Simple)

App load -> App.tsx checks localStorage JWT -> dispatches profile fetch thunks
Navbar reads auth/cart from store (src/customer/components/Navbar/Navbar.tsx)
Pages dispatch thunks -> API calls -> slices update -> UI rerender
Agar chaho to next message me iska ek visual tree (ASCII diagram) de deta hoon jo tum docs me directly use kar sako.


haa karo 

d:\ecommerce-frontend
|
+-- src
|   |
|   +-- index.tsx
|   |   -> ReactDOM render
|   |   -> BrowserRouter
|   |   -> Redux Provider(Store)
|   |
|   +-- App.tsx
|   |   -> ThemeProvider
|   |   -> Navbar (global)
|   |   -> Root routes
|   |      /                      -> Home
|   |      /login                 -> Auth
|   |      /products/:category    -> Product
|   |      /product-details/...   -> ProductDetails
|   |      /reviews/:productId    -> ReviewCard
|   |      /cart                  -> Cart
|   |      /checkout              -> Checkout
|   |      /become-seller         -> BecomeSeller
|   |      /account/*             -> Account (nested)
|   |      /seller/*              -> SellerDashboard (nested)
|   |      /admin/*               -> AdminDashboard (nested)
|   |
|   +-- Routes
|   |   +-- SellerRoutes.tsx
|   |   |   /seller/dashboard
|   |   |   /seller/products
|   |   |   /seller/add-product
|   |   |   /seller/orders
|   |   |   /seller/payments
|   |   |   /seller/transactions
|   |   |   /seller/account
|   |   |
|   |   +-- AdminRoutes.tsx
|   |       /admin/dashboard
|   |       /admin/coupon
|   |       /admin/add-new-coupon-from
|   |       /admin/home-grid
|   |       /admin/electronic-category
|   |       /admin/shop-by-category
|   |       /admin/deals
|   |
|   +-- customer/pages/Account/Account.tsx
|   |   -> nested account routes
|   |      /account/                          -> UserDetails
|   |      /account/orders                    -> Orders
|   |      /account/orders/:orderId/:itemId  -> OrderDetails
|   |      /account/addresses                 -> Address
|   |
|   +-- State
|   |   +-- Store.ts
|   |   |   reducers:
|   |   |   - sellerAuth
|   |   |   - customerAuth
|   |   |   - sellerProduct
|   |   |   - product
|   |   |   - cart
|   |   |
|   |   +-- CustomerLogin
|   |   |   -> sendOtp / signin / register / getUserProfile / logout
|   |   |
|   |   +-- Seller
|   |   |   -> sendLoginSignupOtp / signinSeller / fetchSellerProfile / logout
|   |   |
|   |   +-- Customer
|   |   |   -> fetchAllProduct / searchProducts / fetchProductById
|   |   |
|   |   +-- Cart
|   |       -> fetchUserCart / addToCart / updateItem / deleteItem / applyCoupon
|   |
|   +-- Config/Api.ts
|       -> publicApi (no auth)
|       -> api (JWT interceptor)
|       -> baseURL: http://localhost:8080
|
+-- public
|   -> index.html, manifest, icons
|
+-- package.json / tsconfig.json / tailwind.config.js / etc.
Runtime Data Flow

User Action (UI)
   -> dispatch(thunk)
      -> API call (publicApi/api)
         -> Slice extraReducers
            -> Redux Store update
               -> Components re-render (useAppSelector)

On app startup:
App.tsx useEffect
   -> read seller_jwt / customer_jwt from localStorage
   -> fetchSellerProfile / getUserProfile
   -> Navbar + protected areas reflect logged-in state

