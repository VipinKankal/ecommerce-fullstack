import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Seller Orders
export const sellerOrdersList = createAsyncThunk(
  'masterApi/sellerOrdersList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellerOrders.base);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load seller orders'),
      );
    }
  },
);

export const sellerOrdersUpdateStatus = createAsyncThunk(
  'masterApi/sellerOrdersUpdateStatus',
  async (
    { orderId, orderStatus }: { orderId: number | string; orderStatus: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(
        API_ROUTES.sellerOrders.updateStatus(orderId, orderStatus),
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update seller order status'),
      );
    }
  },
);
