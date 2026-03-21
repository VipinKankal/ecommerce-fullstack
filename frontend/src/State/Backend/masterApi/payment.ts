import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Payment
export const paymentById = createAsyncThunk(
  'masterApi/paymentById',
  async (
    {
      paymentId,
      paymentLinkId,
    }: { paymentId: number | string; paymentLinkId: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.get(API_ROUTES.payment.byId(paymentId), {
        params: { paymentLinkId },
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load payment'));
    }
  },
);
