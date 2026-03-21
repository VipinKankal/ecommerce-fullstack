import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage, publicApi } from './shared';

// Seller (controller-level operations)
export const sellerLogin = createAsyncThunk(
  'masterApi/sellerLogin',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.sellers.login, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Seller login failed'));
    }
  },
);

export const sellerSignup = createAsyncThunk(
  'masterApi/sellerSignup',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.sellers.signup, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Seller signup failed'));
    }
  },
);

export const sellerVerifyEmail = createAsyncThunk(
  'masterApi/sellerVerifyEmail',
  async (
    { otp, email }: { otp: string; email: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await publicApi.patch(
        API_ROUTES.sellers.verifyEmail(otp),
        { email },
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Seller email verification failed'),
      );
    }
  },
);

export const sellerProfile = createAsyncThunk(
  'masterApi/sellerProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.profile);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load seller profile'),
      );
    }
  },
);

export const sellerById = createAsyncThunk(
  'masterApi/sellerById',
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.byId(id));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load seller'));
    }
  },
);

export const sellersList = createAsyncThunk(
  'masterApi/sellersList',
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.list, {
        params: status ? { status } : undefined,
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load sellers'));
    }
  },
);

export const updateSeller = createAsyncThunk(
  'masterApi/updateSeller',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ROUTES.sellers.patch, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Seller update failed'));
    }
  },
);

export const deleteSeller = createAsyncThunk(
  'masterApi/deleteSeller',
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.sellers.delete(id));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Seller delete failed'));
    }
  },
);

export const sellerAccountStatus = createAsyncThunk(
  'masterApi/sellerAccountStatus',
  async (
    { id, status }: { id: number | string; status: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(
        API_ROUTES.sellers.updateStatus(id),
        null,
        {
          params: { status },
        },
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Seller account status update failed'),
      );
    }
  },
);

export const sellerReport = createAsyncThunk(
  'masterApi/sellerReport',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.report);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load seller report'),
      );
    }
  },
);
