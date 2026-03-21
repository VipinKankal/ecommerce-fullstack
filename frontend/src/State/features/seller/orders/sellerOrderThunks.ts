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
  | 'CANCELLED';

export interface SellerOrderItem {
  id?: number;
  product?: {
    title?: string;
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
    email?: string;
    mobileNumber?: string;
  };
  orderItems?: SellerOrderItem[];
}

const buildAuthHeaders = () => {
  const token =
    globalThis.sessionStorage !== undefined
      ? globalThis.sessionStorage.getItem('auth_jwt')
      : null;
  if (!token) return undefined;
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const fetchSellerOrders = createAsyncThunk<SellerOrder[], void>(
  'sellerOrder/fetchSellerOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellerOrders.base, {
        headers: buildAuthHeaders(),
      });
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
        { headers: buildAuthHeaders() },
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update order status'),
      );
    }
  },
);
