import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from 'shared/api/Api';
import { Product } from 'shared/types/product.types';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

export const fetchSellerProducts = createAsyncThunk<Product[], void>(
  'sellerProduct/fetchSellerProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellerProducts.base);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to fetch products'),
      );
    }
  },
);

export const createProduct = createAsyncThunk<
  Product,
  { request: Record<string, unknown> }
>('sellerProduct/createProduct', async ({ request }, { rejectWithValue }) => {
  try {
    const response = await api.post(API_ROUTES.sellerProducts.base, request);
    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error, 'Creation failed'));
  }
});

export const updateSellerProduct = createAsyncThunk<
  Product,
  { productId: number; product: Partial<Product> }
>(
  'sellerProduct/updateSellerProduct',
  async ({ productId, product }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        API_ROUTES.sellerProducts.byId(productId),
        product,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Update failed'));
    }
  },
);

export const transferSellerProductToWarehouse = createAsyncThunk<
  Product,
  { productId: number; quantity: number }
>(
  'sellerProduct/transferSellerProductToWarehouse',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        API_ROUTES.sellerProducts.transferToWarehouse(productId),
        { quantity },
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Warehouse transfer failed'),
      );
    }
  },
);

export const deleteSellerProduct = createAsyncThunk<
  number,
  { productId: number }
>(
  'sellerProduct/deleteSellerProduct',
  async ({ productId }, { rejectWithValue }) => {
    try {
      await api.delete(API_ROUTES.sellerProducts.byId(productId));
      return Number(productId);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Delete failed'));
    }
  },
);
