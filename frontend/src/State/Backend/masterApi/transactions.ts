import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Transactions
export const sellerTransactions = createAsyncThunk(
  'masterApi/sellerTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.transactions.seller);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load seller transactions'),
      );
    }
  },
);

export const allTransactions = createAsyncThunk(
  'masterApi/allTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.transactions.list);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load transactions'),
      );
    }
  },
);
