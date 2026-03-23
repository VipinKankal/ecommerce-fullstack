import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';
import {
  CouponDiscountType,
  CouponScopeType,
  CouponUserEligibilityType,
} from 'shared/types/coupon.types';

export interface CouponCreatePayload {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscount?: number | null;
  minimumOrderValue: number;
  validityStartDate: string;
  validityEndDate: string;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  scopeType?: CouponScopeType;
  scopeId?: number | null;
  firstOrderOnly?: boolean;
  userEligibilityType?: CouponUserEligibilityType;
  inactiveDaysThreshold?: number | null;
  active?: boolean;
}

// Coupons
export const couponApply = createAsyncThunk(
  'masterApi/couponApply',
  async (
    payload: { apply: boolean; code: string },
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

export const couponRecommendation = createAsyncThunk(
  'masterApi/couponRecommendation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.coupons.recommendation);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load coupon recommendation'),
      );
    }
  },
);

export const adminCreateCoupon = createAsyncThunk(
  'masterApi/adminCreateCoupon',
  async (payload: CouponCreatePayload, { rejectWithValue }) => {
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
      const response = await api.patch(API_ROUTES.coupons.adminDisable(id));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Coupon delete failed'));
    }
  },
);

export const adminUpdateCoupon = createAsyncThunk(
  'masterApi/adminUpdateCoupon',
  async (
    payload: { id: number | string; body: CouponCreatePayload },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(
        API_ROUTES.coupons.adminUpdate(payload.id),
        payload.body,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Coupon update failed'));
    }
  },
);

export const adminMapCouponUsers = createAsyncThunk(
  'masterApi/adminMapCouponUsers',
  async (
    payload: { id: number | string; userIds: number[] },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(API_ROUTES.coupons.adminMapUsers(payload.id), {
        userIds: payload.userIds,
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Coupon user mapping failed'),
      );
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

export const adminCouponMetrics = createAsyncThunk<unknown, number | undefined>(
  'masterApi/adminCouponMetrics',
  async (days = 30, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.coupons.adminMetrics, {
        params: { days },
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load coupon metrics'));
    }
  },
);

export const adminCouponMonitoring = createAsyncThunk<
  unknown,
  number | undefined
>(
  'masterApi/adminCouponMonitoring',
  async (windowMinutes = 30, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.coupons.adminMonitoring, {
        params: { windowMinutes },
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load coupon monitoring snapshot'),
      );
    }
  },
);
