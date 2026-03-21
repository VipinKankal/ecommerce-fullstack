import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, getErrorMessage, publicApi } from './shared';

// Home
export const homePing = createAsyncThunk(
  'masterApi/homePing',
  async (_, { rejectWithValue }) => {
    try {
      const response = await publicApi.get(API_ROUTES.home.root);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to load home'));
    }
  },
);
