import { createAsyncThunk } from '@reduxjs/toolkit';
import { api, publicApi, setAuthToken } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';

type SellerProfile = {
  id: number;
  sellerName: string;
  email: string;
  mobileNumber?: string;
  GSTIN?: string;
  dateOfBirth?: string;
  emailVerified?: boolean;
  accountStatus?: string;
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    gstNumber?: string;
    panNumber?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  pickupAddress?: {
    name?: string;
    mobileNumber?: string;
    street?: string;
    locality?: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    country?: string;
  };
  kycDetails?: {
    panCardUrl?: string;
    aadhaarCardUrl?: string;
    gstCertificateUrl?: string;
  };
  storeDetails?: {
    storeName?: string;
    storeLogo?: string;
    storeDescription?: string;
    primaryCategory?: string;
    supportEmail?: string;
    supportPhone?: string;
  };
  role?: string;
};

const readErrorMessage = (error: unknown, fallback: string) => {
  const safeError = error as {
    response?: {
      data?:
        | {
            message?: string;
            error?: { code?: string; details?: unknown } | string;
          }
        | string;
    };
    message?: string;
  };
  const serverData = safeError.response?.data;
  if (typeof serverData === 'string') {
    return serverData || fallback;
  }
  return (
    serverData?.message ||
    (typeof serverData?.error === 'string' ? serverData.error : undefined) ||
    safeError.message ||
    fallback
  );
};

export const sendLoginSignupOtp = createAsyncThunk(
  'auth/sendLoginSignupOtp',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(
        API_ROUTES.auth.sendLoginSignupOtp,
        {
          email: email.trim(),
          role: 'ROLE_SELLER',
        },
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(readErrorMessage(error, 'Failed to send OTP'));
    }
  },
);

export const signinSeller = createAsyncThunk(
  'auth/signinSeller',
  async (loginRequest: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.signin, {
        email: `seller_${loginRequest.email.trim()}`,
        otp: loginRequest.otp,
      });
      if (response.data?.jwt) {
        setAuthToken(response.data.jwt, 'seller');
      } else if (globalThis.sessionStorage !== undefined) {
        globalThis.sessionStorage.setItem('auth_role', 'seller');
        globalThis.sessionStorage.removeItem('auth_jwt');
        delete api.defaults.headers.common.Authorization;
      }

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(readErrorMessage(error, 'Login failed'));
    }
  },
);

export const registerSeller = createAsyncThunk(
  'auth/registerSeller',
  async (sellerData: unknown, { rejectWithValue }) => {
    try {
      const booleanLikeKeys = new Set([
        'emailVerified',
        'verified',
        'isVerified',
        'enabled',
        'active',
        'isActive',
        'deleted',
        'isDeleted',
        'accountNonExpired',
        'accountNonLocked',
        'credentialsNonExpired',
      ]);

      const sanitize = (value: unknown, key?: string): unknown => {
        if (value === null || value === undefined || value === 'null') {
          if (key && booleanLikeKeys.has(key)) return false;
          return undefined;
        }
        if (Array.isArray(value)) {
          return value
            .map((item) => sanitize(item))
            .filter((item) => item !== undefined);
        }
        if (value && typeof value === 'object') {
          return Object.entries(value).reduce(
            (acc, [k, v]) => {
              const sanitizedValue = sanitize(v, k);
              if (sanitizedValue !== undefined) {
                acc[k] = sanitizedValue;
              }
              return acc;
            },
            {} as Record<string, unknown>,
          );
        }
        return value;
      };

      const payload = (sanitize(sellerData) as Record<string, unknown>) || {};
      if (payload.emailVerified === undefined) {
        payload.emailVerified = false;
      }
      const response = await publicApi.post(API_ROUTES.sellers.signup, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Seller registration failed'),
      );
    }
  },
);

export const verifySellerEmail = createAsyncThunk(
  'auth/verifySellerEmail',
  async (
    { otp, email }: { otp: string; email: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await publicApi.patch(
        API_ROUTES.sellers.verifyEmail(otp),
        {
          email,
        },
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Email verification failed'),
      );
    }
  },
);

export const fetchSellerProfile = createAsyncThunk<
  SellerProfile,
  string | void
>('seller/fetchProfile', async (jwt, { rejectWithValue }) => {
  try {
    const response = await api.get(API_ROUTES.sellers.profile, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
    });
    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(readErrorMessage(error, 'Failed to load profile'));
  }
});

export const updateSellerProfile = createAsyncThunk(
  'seller/updateProfile',
  async (payload: unknown, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ROUTES.sellers.patch, payload);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Failed to update seller profile'),
      );
    }
  },
);

export const requestSellerEmailChangeOtp = createAsyncThunk(
  'seller/requestEmailChangeOtp',
  async (newEmail: string, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ROUTES.sellers.requestEmailChangeOtp, {
        newEmail,
      });
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Failed to request seller email change OTP'),
      );
    }
  },
);

export const verifySellerEmailChangeOtp = createAsyncThunk(
  'seller/verifyEmailChangeOtp',
  async (payload: { newEmail: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        API_ROUTES.sellers.verifyEmailChangeOtp,
        payload,
      );
      if (response.data?.jwt) {
        setAuthToken(response.data.jwt, 'seller');
      }
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Failed to verify seller email change OTP'),
      );
    }
  },
);

export const logout = createAsyncThunk<
  string,
  ((path: string) => void) | undefined
>('sellerAuth/logout', async (navigate, { rejectWithValue }) => {
  try {
    await publicApi.post(API_ROUTES.auth.logout).catch(() => {
      return null;
    });
    setAuthToken(null);
    if (navigate) navigate('/');
    return 'Logout successful';
  } catch (error: unknown) {
    void error;
    return rejectWithValue('Failed to logout properly');
  }
});
