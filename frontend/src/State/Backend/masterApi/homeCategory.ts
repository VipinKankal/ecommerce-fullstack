import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage } from './shared';

// Home Category
export const createHomeCategories = createAsyncThunk(
  'masterApi/createHomeCategories',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.homeCategory.create, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Home category create failed'),
      );
    }
  },
);

export const getHomeCategories = createAsyncThunk(
  'masterApi/getHomeCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.homeCategory.adminList);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load home categories'),
      );
    }
  },
);

export const updateHomeCategory = createAsyncThunk(
  'masterApi/updateHomeCategory',
  async (
    { id, payload }: { id: number | string; payload: unknown },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.patch(
        API_ROUTES.homeCategory.adminUpdate(id),
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Home category update failed'),
      );
    }
  },
);
