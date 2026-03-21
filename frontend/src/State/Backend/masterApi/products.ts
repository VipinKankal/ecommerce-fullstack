import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, getErrorMessage, publicApi } from './shared';

// Products
export const productsList = createAsyncThunk(
  'masterApi/productsList',
  async (params: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.products.list, {
        params,
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load products'));
    }
  },
);

export const productsSearch = createAsyncThunk(
  'masterApi/productsSearch',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.products.search, {
        params: { query },
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Product search failed'));
    }
  },
);

export const productById = createAsyncThunk(
  'masterApi/productById',
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.products.byId(productId));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load product'));
    }
  },
);
