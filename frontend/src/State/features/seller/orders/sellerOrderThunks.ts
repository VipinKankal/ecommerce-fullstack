import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

export type SellerOrderStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'EXCHANGE_REQUESTED'
  | 'EXCHANGE_SHIPPED'
  | 'CANCELLED';

export interface SellerOrderTaxSnapshot {
  id?: number;
  orderType?: string;
  supplierGstin?: string;
  sellerStateCode?: string;
  posStateCode?: string;
  supplyType?: string;
  totalTaxableValue?: number;
  totalGstAmount?: number;
  totalAmountCharged?: number;
  totalAmountWithTax?: number;
  totalCommissionAmount?: number;
  totalCommissionGstAmount?: number;
  tcsRatePercentage?: number;
  tcsAmount?: number;
  gstRuleVersion?: string;
  tcsRuleVersion?: string;
  snapshotSource?: string;
  effectiveTaxDate?: string;
  frozenAt?: string;
}

export interface SellerOrderItem {
  id?: number;
  size?: string;
  quantity?: number;
  mrpPrice?: number;
  sellingPrice?: number;
  product?: {
    title?: string;
    description?: string;
    color?: string;
    images?: string[];
  };
}

export interface SellerOrder {
  id: number;
  orderStatus: SellerOrderStatus;
  totalSellingPrice: number;
  totalMrpPrice: number;
  totalItems: number;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentType?: string;
  provider?: string;
  createdAt?: string;
  orderDate?: string;
  deliveryDate?: string;
  shippingAddress?: {
    name?: string;
    address?: string;
    locality?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    mobileNumber?: string;
  };
  user?: {
    fullName?: string;
  };
  orderItems?: SellerOrderItem[];
  orderTaxSnapshot?: SellerOrderTaxSnapshot | null;
}

export const fetchSellerOrders = createAsyncThunk<SellerOrder[], void>(
  'sellerOrder/fetchSellerOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellerOrders.base);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch orders'));
    }
  },
);

export const updateSellerOrderStatus = createAsyncThunk<
  SellerOrder,
  { orderId: number; orderStatus: SellerOrderStatus }
>(
  'sellerOrder/updateSellerOrderStatus',
  async ({ orderId, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        API_ROUTES.sellerOrders.updateStatus(orderId, orderStatus),
        null,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update order status'),
      );
    }
  },
);
