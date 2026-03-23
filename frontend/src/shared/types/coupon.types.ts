import { Cart } from './cart.types';

export type CouponDiscountType = 'PERCENT' | 'FLAT';
export type CouponScopeType = 'GLOBAL' | 'SELLER' | 'CATEGORY' | 'PRODUCT';
export type CouponUserEligibilityType =
  | 'ALL_USERS'
  | 'NEW_USERS_ONLY'
  | 'RETURNING_USERS_ONLY'
  | 'INACTIVE_USERS_ONLY';

export interface Coupon {
  id: number;
  code: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  discountPercentage: number;
  maxDiscount?: number | null;
  validityStartDate: string;
  validityEndDate: string;
  minimumOrderValue: number;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  usedCount?: number | null;
  scopeType?: CouponScopeType;
  scopeId?: number | null;
  firstOrderOnly?: boolean;
  userEligibilityType?: CouponUserEligibilityType;
  inactiveDaysThreshold?: number | null;
  mappedUserCount?: number | null;
  isActive: boolean;
}

export interface CouponState {
  coupon: Coupon[];
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  couponApplied: boolean;
  couponCreated: boolean;
}
