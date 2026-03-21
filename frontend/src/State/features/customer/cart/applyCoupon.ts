import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Cart } from 'shared/types/cart.types';
import { api } from 'shared/api/Api';
import { CouponState } from 'shared/types/coupon.types';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

export const applyCoupon = createAsyncThunk<
  Cart,
  {
    apply: boolean;
    code: string;
    orderValue: number;
  },
  { rejectValue: string }
>(
  'cart/applyCoupon',
  async ({ apply, code, orderValue }, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.coupons.apply, {
        apply,
        code,
        orderValue,
      });

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to apply coupon'));
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
        state.error = action.payload || 'Something went wrong';
        state.couponApplied = false;
      });
  },
});

export const { resetCouponState } = couponSlice.actions;
export default couponSlice.reducer;
