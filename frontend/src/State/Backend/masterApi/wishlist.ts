import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Wishlist
export const wishlist = createAsyncThunk(
  'masterApi/wishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.wishlist.base);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load wishlist'));
    }
  },
);

export const wishlistAddProduct = createAsyncThunk(
  'masterApi/wishlistAddProduct',
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.post(
        API_ROUTES.wishlist.addProduct(productId),
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to add product to wishlist'),
      );
    }
  },
);
