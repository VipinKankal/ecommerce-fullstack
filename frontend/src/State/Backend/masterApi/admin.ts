import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Admin
export const adminProfile = createAsyncThunk(
  'masterApi/adminProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.profile);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load admin profile'),
      );
    }
  },
);

export const adminDashboardSummary = createAsyncThunk(
  'masterApi/adminDashboardSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.dashboardSummary);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load admin dashboard summary'),
      );
    }
  },
);

export const adminUsersList = createAsyncThunk(
  'masterApi/adminUsersList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.users);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load admin users'),
      );
    }
  },
);

export const adminUpdateUserStatus = createAsyncThunk(
  'masterApi/adminUpdateUserStatus',
  async (
    { id, status }: { id: number | string; status: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(API_ROUTES.admin.userStatus(id, status));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update user status'),
      );
    }
  },
);

export const adminProductsList = createAsyncThunk(
  'masterApi/adminProductsList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.products);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load admin products'),
      );
    }
  },
);

export const adminOrdersList = createAsyncThunk(
  'masterApi/adminOrdersList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.orders);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load admin orders'),
      );
    }
  },
);

export const adminPaymentsList = createAsyncThunk(
  'masterApi/adminPaymentsList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.payments);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load admin payments'),
      );
    }
  },
);

export const adminSalesReport = createAsyncThunk(
  'masterApi/adminSalesReport',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.admin.salesReport);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load admin sales report'),
      );
    }
  },
);

export const adminUpdateSellerStatus = createAsyncThunk(
  'masterApi/adminUpdateSellerStatus',
  async (
    { id, status }: { id: number | string; status: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        API_ROUTES.admin.updateSellerStatus(id, status),
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update seller status'),
      );
    }
  },
);
