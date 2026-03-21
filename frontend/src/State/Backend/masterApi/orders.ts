import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Orders
export const createOrder = createAsyncThunk(
  'masterApi/createOrder',
  async (
    {
      shippingAddress,
      paymentMethod,
    }: {
      shippingAddress: unknown;
      paymentMethod: 'RAZORPAY' | 'STRIPE';
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(API_ROUTES.orders.base, shippingAddress, {
        params: { paymentMethod },
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Order create failed'));
    }
  },
);

export const createCheckoutOrder = createAsyncThunk(
  'masterApi/createCheckoutOrder',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.orders.create, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to create checkout order'),
      );
    }
  },
);

export const orderSummary = createAsyncThunk(
  'masterApi/orderSummary',
  async (shippingAddress: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(
        API_ROUTES.orders.summary,
        shippingAddress,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to build order summary'),
      );
    }
  },
);

export const createPaymentOrder = createAsyncThunk(
  'masterApi/createPaymentOrder',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.payment.createOrder, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to create payment order'),
      );
    }
  },
);

export const retryPaymentOrder = createAsyncThunk(
  'masterApi/retryPaymentOrder',
  async (orderId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.payment.retry(orderId));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to retry payment'));
    }
  },
);

export const submitManualUpiPayment = createAsyncThunk(
  'masterApi/submitManualUpiPayment',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(
        API_ROUTES.payment.manualUpiSubmit,
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to submit manual UPI payment'),
      );
    }
  },
);

export const manualUpiPaymentsList = createAsyncThunk(
  'masterApi/manualUpiPaymentsList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.payment.manualUpiList);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load manual UPI submissions'),
      );
    }
  },
);

export const verifyManualUpiPayment = createAsyncThunk(
  'masterApi/verifyManualUpiPayment',
  async (
    {
      manualPaymentId,
      status,
      rejectionReason,
    }: {
      manualPaymentId: number | string;
      status: string;
      rejectionReason?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(
        API_ROUTES.payment.manualUpiVerify(manualPaymentId),
        {
          status,
          rejectionReason,
        },
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to verify manual UPI payment'),
      );
    }
  },
);

export const userOrderHistory = createAsyncThunk(
  'masterApi/userOrderHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.orders.userHistory);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load order history'),
      );
    }
  },
);

export const orderById = createAsyncThunk(
  'masterApi/orderById',
  async (orderId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.orders.byId(orderId));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load order'));
    }
  },
);

export const orderItemById = createAsyncThunk(
  'masterApi/orderItemById',
  async (orderItemId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.orders.itemById(orderItemId));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load order item'),
      );
    }
  },
);

export const orderCancelReasons = createAsyncThunk(
  'masterApi/orderCancelReasons',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.orders.cancelReasons);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load cancel reasons'),
      );
    }
  },
);

export const cancelOrder = createAsyncThunk(
  'masterApi/cancelOrder',
  async (
    {
      orderId,
      cancelReasonCode,
      cancelReasonText,
    }: {
      orderId: number | string;
      cancelReasonCode: string;
      cancelReasonText?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(API_ROUTES.orders.cancel(orderId), {
        cancelReasonCode,
        cancelReasonText,
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Order cancel failed'));
    }
  },
);
