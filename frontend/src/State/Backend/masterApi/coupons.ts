import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Coupons
export const couponApply = createAsyncThunk(
  'masterApi/couponApply',
  async (
    payload: { apply: boolean; code: string; orderValue: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(API_ROUTES.coupons.apply, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Coupon apply failed'));
    }
  },
);

export const adminCreateCoupon = createAsyncThunk(
  'masterApi/adminCreateCoupon',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.coupons.adminCreate, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Coupon create failed'));
    }
  },
);

export const adminDeleteCoupon = createAsyncThunk(
  'masterApi/adminDeleteCoupon',
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.coupons.adminDelete(id));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Coupon delete failed'));
    }
  },
);

export const adminAllCoupons = createAsyncThunk(
  'masterApi/adminAllCoupons',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.coupons.adminAll);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load coupons'));
    }
  },
);
