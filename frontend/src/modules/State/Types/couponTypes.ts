import { Cart } from "./cartTypes";

export interface Coupon {
  id: number;
  code: string;
  discountPercentage: number;
  validityStartDate: string;
  validityEndDate: string;
  minimumOrderValue: number;
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