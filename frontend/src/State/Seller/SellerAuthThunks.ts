import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, publicApi, setAuthToken } from "../../Config/Api";
import { API_ROUTES } from "../../Config/ApiRoutes";

export const sendLoginSignupOtp = createAsyncThunk(
  "auth/sendLoginSignupOtp",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.sendLoginSignupOtp, {
        email: email.trim(),
        role: "ROLE_SELLER",
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Failed to send OTP");
    }
  },
);

export const signinSeller = createAsyncThunk(
  "auth/signinSeller",
  async (loginRequest: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await publicApi.post(API_ROUTES.auth.signin, {
        email: `seller_${loginRequest.email.trim()}`,
        otp: loginRequest.otp,
      });
      if (response.data?.jwt) {
        setAuthToken(response.data.jwt, "seller");
      } else if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_role", "seller");
        sessionStorage.removeItem("auth_jwt");
        delete api.defaults.headers.common.Authorization;
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Login failed");
    }
  },
);

export const registerSeller = createAsyncThunk(
  "auth/registerSeller",
  async (sellerData: any, { rejectWithValue }) => {
    try {
      const booleanLikeKeys = new Set([
        "emailVerified",
        "verified",
        "isVerified",
        "enabled",
        "active",
        "isActive",
        "deleted",
        "isDeleted",
        "accountNonExpired",
        "accountNonLocked",
        "credentialsNonExpired",
      ]);

      const sanitize = (value: any, key?: string): any => {
        if (value === null || value === undefined || value === "null") {
          if (key && booleanLikeKeys.has(key)) return false;
          return undefined;
        }
        if (Array.isArray(value)) {
          return value
            .map((item) => sanitize(item))
            .filter((item) => item !== undefined);
        }
        if (value && typeof value === "object") {
          return Object.entries(value).reduce((acc, [k, v]) => {
            const sanitizedValue = sanitize(v, k);
            if (sanitizedValue !== undefined) {
              acc[k] = sanitizedValue;
            }
            return acc;
          }, {} as Record<string, any>);
        }
        return value;
      };

      const payload = sanitize(sellerData) || {};
      if (payload.emailVerified === undefined) {
        payload.emailVerified = false;
      }
      const response = await publicApi.post(API_ROUTES.sellers.signup, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Seller registration failed",
      );
    }
  },
);

export const verifySellerEmail = createAsyncThunk(
  "auth/verifySellerEmail",
  async (
    { otp, email }: { otp: string; email: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await publicApi.patch(API_ROUTES.sellers.verifyEmail(otp), {
        email,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Email verification failed",
      );
    }
  },
);

export const fetchSellerProfile = createAsyncThunk<any, string | void>(
  "seller/fetchProfile",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.sellers.profile, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load profile",
      );
    }
  },
);

export const updateSellerProfile = createAsyncThunk(
  "seller/updateProfile",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ROUTES.sellers.patch, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update seller profile",
      );
    }
  },
);

export const logout = createAsyncThunk<any, any>(
  "sellerAuth/logout",
  async (navigate, { rejectWithValue }) => {
    try {
      await publicApi.post(API_ROUTES.auth.logout).catch(() => {
        return null;
      });
      setAuthToken(null);
      if (navigate) navigate("/");
      return "Logout successful";
    } catch (error: any) {
      return rejectWithValue("Failed to logout properly");
    }
  },
);
