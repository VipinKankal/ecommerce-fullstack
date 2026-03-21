import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_ROUTES, api, getErrorMessage, publicApi } from './shared';

// Auth/User
export const authSignup = createAsyncThunk(
  'masterApi/authSignup',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.signup, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Signup failed'));
    }
  },
);

export const authSendOtp = createAsyncThunk(
  'masterApi/authSendOtp',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(
        API_ROUTES.auth.sendLoginSignupOtp,
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'OTP send failed'));
    }
  },
);

export const authSignin = createAsyncThunk(
  'masterApi/authSignin',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.signin, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Signin failed'));
    }
  },
);

export const userProfile = createAsyncThunk(
  'masterApi/userProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.user.profile);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to load user profile'),
      );
    }
  },
);
