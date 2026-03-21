import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage, publicApi } from './shared';

// Reviews
export const createReview = createAsyncThunk(
  'masterApi/createReview',
  async (
    { productId, payload }: { productId: number | string; payload: unknown },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.post(
        API_ROUTES.reviews.byProduct(productId),
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Review create failed'));
    }
  },
);

export const reviewsByProduct = createAsyncThunk(
  'masterApi/reviewsByProduct',
  async (productId: number | string, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(
        API_ROUTES.reviews.byProduct(productId),
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load reviews'));
    }
  },
);

export const updateReview = createAsyncThunk(
  'masterApi/updateReview',
  async (
    { reviewId, payload }: { reviewId: number | string; payload: unknown },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(
        API_ROUTES.reviews.byId(reviewId),
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Review update failed'));
    }
  },
);

export const deleteReview = createAsyncThunk(
  'masterApi/deleteReview',
  async (reviewId: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.reviews.byId(reviewId));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Review delete failed'));
    }
  },
);
