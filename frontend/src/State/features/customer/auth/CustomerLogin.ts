import { createAsyncThunk } from '@reduxjs/toolkit';
import { api, publicApi, setAuthToken } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { Address } from 'shared/types/user.types';
import { getErrorMessage } from 'shared/errors/apiError';

type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  mobileNumber?: string;
  accountStatus?: string;
  role: string;
  addresses?: Address[];
  activeDeviceCount?: number;
  loginHistory?: Array<{
    device?: string;
    ipAddress?: string;
    loginAt?: string;
    logoutAt?: string;
    active?: boolean;
  }>;
};

export const sendOtp = createAsyncThunk(
  'auth/sendLoginSignupOtp',
  async (
    { email, isLogin }: { email: string; isLogin: boolean },
    { rejectWithValue },
  ) => {
    try {
      const formattedEmail = isLogin ? `signing_${email}` : email;

      const response = await publicApi.post(
        API_ROUTES.auth.sendLoginSignupOtp,
        {
          email: formattedEmail,
          role: 'ROLE_CUSTOMER',
        },
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to send OTP'));
    }
  },
);

export const signinCustomer = createAsyncThunk(
  'auth/signin',
  async (loginRequest: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(
        API_ROUTES.auth.signin,
        loginRequest,
      );
      if (response.data?.jwt) {
        setAuthToken(response.data.jwt, 'customer', { persistToken: false });
      } else if (globalThis.sessionStorage !== undefined) {
        globalThis.sessionStorage.setItem('auth_role', 'customer');
        globalThis.sessionStorage.removeItem('auth_jwt');
        delete api.defaults.headers.common.Authorization;
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Login failed'));
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    userData: { fullName: string; email: string; otp: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.signup, userData);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Registration failed'));
    }
  },
);

export const getUserProfile = createAsyncThunk<UserProfile, string | void>(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.user.profile);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Profile load failed'));
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (
    payload: { fullName: string; mobileNumber?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(API_ROUTES.user.profile, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Profile update failed'));
    }
  },
);

export const addUserAddress = createAsyncThunk(
  'auth/addUserAddress',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.user.addresses, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Address add failed'));
    }
  },
);

export const updateUserAddress = createAsyncThunk(
  'auth/updateUserAddress',
  async (
    { addressId, payload }: { addressId: number; payload: unknown },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.put(
        API_ROUTES.user.addressById(addressId),
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Address update failed'));
    }
  },
);

export const deleteUserAddress = createAsyncThunk(
  'auth/deleteUserAddress',
  async (addressId: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(API_ROUTES.user.addressById(addressId));
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Address delete failed'));
    }
  },
);

export const requestEmailChangeOtp = createAsyncThunk(
  'auth/requestEmailChangeOtp',
  async (newEmail: string, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.user.requestEmailChangeOtp, {
        newEmail,
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to request email change OTP'),
      );
    }
  },
);

export const verifyEmailChangeOtp = createAsyncThunk(
  'auth/verifyEmailChangeOtp',
  async (payload: { newEmail: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        API_ROUTES.user.verifyEmailChangeOtp,
        payload,
      );
      if (response.data?.jwt) {
        setAuthToken(response.data.jwt, 'customer', { persistToken: false });
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to verify email change OTP'),
      );
    }
  },
);

export const deactivateAccount = createAsyncThunk(
  'auth/deactivateAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.put(API_ROUTES.user.deactivate);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to deactivate account'),
      );
    }
  },
);

export const logout = createAsyncThunk(
  'customerAuth/logout',
  async (navigate?: (path: string) => void) => {
    await publicApi.post(API_ROUTES.auth.logout).catch(() => {
      return null;
    });
    setAuthToken(null);
    if (navigate) navigate('/');
    return 'Logout successful';
  },
);



