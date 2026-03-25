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

export const sellerSettlements = createAsyncThunk(
  'masterApi/sellerSettlements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.settlements.seller);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load seller settlements'),
      );
    }
  },
);

export const sellerSettlementLedger = createAsyncThunk(
  'masterApi/sellerSettlementLedger',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.settlements.sellerLedger);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load seller settlement ledger'),
      );
    }
  },
);

export const adminSettlements = createAsyncThunk(
  'masterApi/adminSettlements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.settlements.list);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load settlements'),
      );
    }
  },
);

export const adminSettlementLedger = createAsyncThunk(
  'masterApi/adminSettlementLedger',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.settlements.ledger);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load settlement ledger'),
      );
    }
  },
);
