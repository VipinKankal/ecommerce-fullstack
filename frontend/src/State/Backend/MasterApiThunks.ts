import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, publicApi } from "../../Config/Api";
import { API_ROUTES } from "../../Config/ApiRoutes";

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

// Home
export const homePing = createAsyncThunk("masterApi/homePing", async (_, { rejectWithValue }) => {
  try {
    const response = await publicApi.get(API_ROUTES.home.root);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, "Failed to load home"));
  }
});

// Auth/User
export const authSignup = createAsyncThunk(
  "masterApi/authSignup",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.signup, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Signup failed"));
    }
  },
);

export const authSendOtp = createAsyncThunk(
  "masterApi/authSendOtp",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.sendLoginSignupOtp, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "OTP send failed"));
    }
  },
);

export const authSignin = createAsyncThunk(
  "masterApi/authSignin",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.signin, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Signin failed"));
    }
  },
);

export const userProfile = createAsyncThunk(
  "masterApi/userProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.user.profile);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load user profile"));
    }
  },
);

// Products
export const productsList = createAsyncThunk(
  "masterApi/productsList",
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.products.list, { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load products"));
    }
  },
);

export const productsSearch = createAsyncThunk(
  "masterApi/productsSearch",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.products.search, {
        params: { query },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Product search failed"));
    }
  },
);

export const productById = createAsyncThunk(
  "masterApi/productById",
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.products.byId(productId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load product"));
    }
  },
);

// Admin
export const adminProfile = createAsyncThunk(
  "masterApi/adminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.profile);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load admin profile"));
    }
  },
);

export const adminDashboardSummary = createAsyncThunk(
  "masterApi/adminDashboardSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.dashboardSummary);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load admin dashboard summary"));
    }
  },
);

export const adminUsersList = createAsyncThunk(
  "masterApi/adminUsersList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.users);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load admin users"));
    }
  },
);

export const adminUpdateUserStatus = createAsyncThunk(
  "masterApi/adminUpdateUserStatus",
  async (
    { id, status }: { id: number | string; status: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(API_ROUTES.admin.userStatus(id, status));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to update user status"));
    }
  },
);

export const adminProductsList = createAsyncThunk(
  "masterApi/adminProductsList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.products);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load admin products"));
    }
  },
);

export const adminOrdersList = createAsyncThunk(
  "masterApi/adminOrdersList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.orders);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load admin orders"));
    }
  },
);

export const adminPaymentsList = createAsyncThunk(
  "masterApi/adminPaymentsList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.payments);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load admin payments"));
    }
  },
);

export const adminSalesReport = createAsyncThunk(
  "masterApi/adminSalesReport",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.salesReport);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load admin sales report"));
    }
  },
);

export const adminUpdateSellerStatus = createAsyncThunk(
  "masterApi/adminUpdateSellerStatus",
  async (
    { id, status }: { id: number | string; status: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(API_ROUTES.admin.updateSellerStatus(id, status));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to update seller status"));
    }
  },
);

// Cart
export const cartGet = createAsyncThunk("masterApi/cartGet", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(API_ROUTES.cart.base);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error, "Failed to load cart"));
  }
});

export const cartAddItem = createAsyncThunk(
  "masterApi/cartAddItem",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.put(API_ROUTES.cart.add, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to add cart item"));
    }
  },
);

export const cartUpdateItem = createAsyncThunk(
  "masterApi/cartUpdateItem",
  async (
    { cartItemId, payload }: { cartItemId: number | string; payload: any },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(API_ROUTES.cart.item(cartItemId), payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to update cart item"));
    }
  },
);

export const cartDeleteItem = createAsyncThunk(
  "masterApi/cartDeleteItem",
  async (cartItemId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.cart.item(cartItemId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete cart item"));
    }
  },
);

// Coupons
export const couponApply = createAsyncThunk(
  "masterApi/couponApply",
  async (payload: { apply: boolean; code: string; orderValue: number }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.coupons.apply, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Coupon apply failed"));
    }
  },
);

export const adminCreateCoupon = createAsyncThunk(
  "masterApi/adminCreateCoupon",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.coupons.adminCreate, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Coupon create failed"));
    }
  },
);

export const adminDeleteCoupon = createAsyncThunk(
  "masterApi/adminDeleteCoupon",
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.coupons.adminDelete(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Coupon delete failed"));
    }
  },
);

export const adminAllCoupons = createAsyncThunk(
  "masterApi/adminAllCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.coupons.adminAll);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load coupons"));
    }
  },
);

// Deals
export const createDeal = createAsyncThunk(
  "masterApi/createDeal",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.deals.base, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Deal create failed"));
    }
  },
);

export const updateDeal = createAsyncThunk(
  "masterApi/updateDeal",
  async ({ id, payload }: { id: number | string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ROUTES.deals.byId(id), payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Deal update failed"));
    }
  },
);

export const deleteDeal = createAsyncThunk(
  "masterApi/deleteDeal",
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.deals.byId(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Deal delete failed"));
    }
  },
);

// Home Category
export const createHomeCategories = createAsyncThunk(
  "masterApi/createHomeCategories",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.homeCategory.create, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Home category create failed"));
    }
  },
);

export const getHomeCategories = createAsyncThunk(
  "masterApi/getHomeCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.homeCategory.adminList);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load home categories"));
    }
  },
);

export const updateHomeCategory = createAsyncThunk(
  "masterApi/updateHomeCategory",
  async ({ id, payload }: { id: number | string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ROUTES.homeCategory.adminUpdate(id), payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Home category update failed"));
    }
  },
);

// Orders
export const createOrder = createAsyncThunk(
  "masterApi/createOrder",
  async (
    {
      shippingAddress,
      paymentMethod,
    }: {
      shippingAddress: any;
      paymentMethod: "RAZORPAY" | "STRIPE";
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(API_ROUTES.orders.base, shippingAddress, {
        params: { paymentMethod },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Order create failed"));
    }
  },
);

export const createCheckoutOrder = createAsyncThunk(
  "masterApi/createCheckoutOrder",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.orders.create, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to create checkout order"));
    }
  },
);

export const orderSummary = createAsyncThunk(
  "masterApi/orderSummary",
  async (shippingAddress: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.orders.summary, shippingAddress);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to build order summary"));
    }
  },
);

export const createPaymentOrder = createAsyncThunk(
  "masterApi/createPaymentOrder",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.payment.createOrder, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to create payment order"));
    }
  },
);

export const retryPaymentOrder = createAsyncThunk(
  "masterApi/retryPaymentOrder",
  async (orderId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.payment.retry(orderId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to retry payment"));
    }
  },
);

export const submitManualUpiPayment = createAsyncThunk(
  "masterApi/submitManualUpiPayment",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.payment.manualUpiSubmit, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to submit manual UPI payment"));
    }
  },
);

export const manualUpiPaymentsList = createAsyncThunk(
  "masterApi/manualUpiPaymentsList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.payment.manualUpiList);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load manual UPI submissions"));
    }
  },
);

export const verifyManualUpiPayment = createAsyncThunk(
  "masterApi/verifyManualUpiPayment",
  async (
    {
      manualPaymentId,
      status,
      rejectionReason,
    }: { manualPaymentId: number | string; status: string; rejectionReason?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(API_ROUTES.payment.manualUpiVerify(manualPaymentId), {
        status,
        rejectionReason,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to verify manual UPI payment"));
    }
  },
);

export const userOrderHistory = createAsyncThunk(
  "masterApi/userOrderHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.orders.userHistory);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load order history"));
    }
  },
);

export const orderById = createAsyncThunk(
  "masterApi/orderById",
  async (orderId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.orders.byId(orderId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load order"));
    }
  },
);

export const orderItemById = createAsyncThunk(
  "masterApi/orderItemById",
  async (orderItemId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.orders.itemById(orderItemId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load order item"));
    }
  },
);

export const orderCancelReasons = createAsyncThunk(
  "masterApi/orderCancelReasons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.orders.cancelReasons);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load cancel reasons"));
    }
  },
);

export const cancelOrder = createAsyncThunk(
  "masterApi/cancelOrder",
  async (
    {
      orderId,
      cancelReasonCode,
      cancelReasonText,
    }: { orderId: number | string; cancelReasonCode: string; cancelReasonText?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(API_ROUTES.orders.cancel(orderId), {
        cancelReasonCode,
        cancelReasonText,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Order cancel failed"));
    }
  },
);

// Payment
export const paymentById = createAsyncThunk(
  "masterApi/paymentById",
  async (
    { paymentId, paymentLinkId }: { paymentId: number | string; paymentLinkId: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(API_ROUTES.payment.byId(paymentId), {
        params: { paymentLinkId },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load payment"));
    }
  },
);

// Reviews
export const createReview = createAsyncThunk(
  "masterApi/createReview",
  async ({ productId, payload }: { productId: number | string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.reviews.byProduct(productId), payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Review create failed"));
    }
  },
);

export const reviewsByProduct = createAsyncThunk(
  "masterApi/reviewsByProduct",
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.reviews.byProduct(productId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load reviews"));
    }
  },
);

export const updateReview = createAsyncThunk(
  "masterApi/updateReview",
  async ({ reviewId, payload }: { reviewId: number | string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ROUTES.reviews.byId(reviewId), payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Review update failed"));
    }
  },
);

export const deleteReview = createAsyncThunk(
  "masterApi/deleteReview",
  async (reviewId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.reviews.byId(reviewId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Review delete failed"));
    }
  },
);

// Seller (controller-level operations)
export const sellerLogin = createAsyncThunk(
  "masterApi/sellerLogin",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.sellers.login, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Seller login failed"));
    }
  },
);

export const sellerSignup = createAsyncThunk(
  "masterApi/sellerSignup",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.sellers.signup, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Seller signup failed"));
    }
  },
);

export const sellerVerifyEmail = createAsyncThunk(
  "masterApi/sellerVerifyEmail",
  async ({ otp, email }: { otp: string; email: string }, { rejectWithValue }) => {
    try {
      const response = await publicApi.patch(API_ROUTES.sellers.verifyEmail(otp), { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Seller email verification failed"));
    }
  },
);

export const sellerProfile = createAsyncThunk(
  "masterApi/sellerProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.profile);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load seller profile"));
    }
  },
);

export const sellerById = createAsyncThunk(
  "masterApi/sellerById",
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.byId(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load seller"));
    }
  },
);

export const sellersList = createAsyncThunk(
  "masterApi/sellersList",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.list, {
        params: status ? { status } : undefined,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load sellers"));
    }
  },
);

export const updateSeller = createAsyncThunk(
  "masterApi/updateSeller",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ROUTES.sellers.patch, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Seller update failed"));
    }
  },
);

export const deleteSeller = createAsyncThunk(
  "masterApi/deleteSeller",
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.sellers.delete(id));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Seller delete failed"));
    }
  },
);

export const sellerAccountStatus = createAsyncThunk(
  "masterApi/sellerAccountStatus",
  async ({ id, status }: { id: number | string; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(API_ROUTES.sellers.updateStatus(id), null, {
        params: { status },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Seller account status update failed"));
    }
  },
);

export const sellerReport = createAsyncThunk(
  "masterApi/sellerReport",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.report);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load seller report"));
    }
  },
);

// Seller Products
export const sellerProductsList = createAsyncThunk(
  "masterApi/sellerProductsList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellerProducts.base);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load seller products"));
    }
  },
);

export const sellerProductsCreate = createAsyncThunk(
  "masterApi/sellerProductsCreate",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.sellerProducts.base, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to create seller product"));
    }
  },
);

export const sellerProductsUpdate = createAsyncThunk(
  "masterApi/sellerProductsUpdate",
  async (
    { productId, payload }: { productId: number | string; payload: any },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(API_ROUTES.sellerProducts.byId(productId), payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to update seller product"));
    }
  },
);

export const sellerProductsDelete = createAsyncThunk(
  "masterApi/sellerProductsDelete",
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.sellerProducts.byId(productId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to delete seller product"));
    }
  },
);

// Seller Orders
export const sellerOrdersList = createAsyncThunk(
  "masterApi/sellerOrdersList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellerOrders.base);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load seller orders"));
    }
  },
);

export const sellerOrdersUpdateStatus = createAsyncThunk(
  "masterApi/sellerOrdersUpdateStatus",
  async (
    { orderId, orderStatus }: { orderId: number | string; orderStatus: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(
        API_ROUTES.sellerOrders.updateStatus(orderId, orderStatus),
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to update seller order status"));
    }
  },
);

// Transactions
export const sellerTransactions = createAsyncThunk(
  "masterApi/sellerTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.transactions.seller);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load seller transactions"));
    }
  },
);

export const allTransactions = createAsyncThunk(
  "masterApi/allTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.transactions.list);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load transactions"));
    }
  },
);

// Wishlist
export const wishlist = createAsyncThunk(
  "masterApi/wishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.wishlist.base);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load wishlist"));
    }
  },
);

export const wishlistAddProduct = createAsyncThunk(
  "masterApi/wishlistAddProduct",
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.wishlist.addProduct(productId));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to add product to wishlist"));
    }
  },
);
