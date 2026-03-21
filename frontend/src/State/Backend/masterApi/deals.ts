import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Deals
export const createDeal = createAsyncThunk(
  'masterApi/createDeal',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.deals.base, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Deal create failed'));
    }
  },
);

export const updateDeal = createAsyncThunk(
  'masterApi/updateDeal',
  async (
    { id, payload }: { id: number | string; payload: unknown },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(API_ROUTES.deals.byId(id), payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Deal update failed'));
    }
  },
);

export const deleteDeal = createAsyncThunk(
  'masterApi/deleteDeal',
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.deals.byId(id));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Deal delete failed'));
    }
  },
);
