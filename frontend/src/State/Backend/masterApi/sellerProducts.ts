import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Seller Products
export const sellerProductsList = createAsyncThunk(
  'masterApi/sellerProductsList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellerProducts.base);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load seller products'),
      );
    }
  },
);

export const sellerProductsCreate = createAsyncThunk(
  'masterApi/sellerProductsCreate',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.sellerProducts.base, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to create seller product'),
      );
    }
  },
);

export const sellerProductsUpdate = createAsyncThunk(
  'masterApi/sellerProductsUpdate',
  async (
    { productId, payload }: { productId: number | string; payload: unknown },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(
        API_ROUTES.sellerProducts.byId(productId),
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update seller product'),
      );
    }
  },
);

export const sellerProductsDelete = createAsyncThunk(
  'masterApi/sellerProductsDelete',
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        API_ROUTES.sellerProducts.byId(productId),
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to delete seller product'),
      );
    }
  },
);
