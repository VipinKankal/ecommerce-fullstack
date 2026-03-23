import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Cart } from 'shared/types/cart.types';
import { api } from 'shared/api/Api';
import { CouponState } from 'shared/types/coupon.types';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import {
  getApiError,
  getThunkErrorMessage,
  type ApiRequestError,
} from 'State/backend/masterApi/shared';

export const applyCoupon = createAsyncThunk<
  Cart,
  {
    apply: boolean;
    code: string;
  },
  { rejectValue: ApiRequestError }
>(
  'cart/applyCoupon',
  async ({ apply, code }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.coupons.apply, {
        apply,
        code,
      });

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, 'Failed to apply coupon'));
    }
  },
);

const initialState: CouponState = {
  coupon: [],
  cart: null,
  loading: false,
  error: null,
  couponApplied: false,
  couponCreated: false,
};

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    resetCouponState: (state) => {
      state.couponApplied = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.couponApplied = action.meta.arg.apply;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = getThunkErrorMessage(action.payload, 'Something went wrong');
        state.couponApplied = false;
      });
  },
});

export const { resetCouponState } = couponSlice.actions;
export default couponSlice.reducer;
