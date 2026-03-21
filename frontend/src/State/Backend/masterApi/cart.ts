import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Cart
export const cartGet = createAsyncThunk(
  'masterApi/cartGet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.cart.base);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load cart'));
    }
  },
);

export const cartAddItem = createAsyncThunk(
  'masterApi/cartAddItem',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.put(API_ROUTES.cart.add, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to add cart item'));
    }
  },
);

export const cartUpdateItem = createAsyncThunk(
  'masterApi/cartUpdateItem',
  async (
    { cartItemId, payload }: { cartItemId: number | string; payload: unknown },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(API_ROUTES.cart.item(cartItemId), payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update cart item'),
      );
    }
  },
);

export const cartDeleteItem = createAsyncThunk(
  'masterApi/cartDeleteItem',
  async (cartItemId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.cart.item(cartItemId));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to delete cart item'),
      );
    }
  },
);
