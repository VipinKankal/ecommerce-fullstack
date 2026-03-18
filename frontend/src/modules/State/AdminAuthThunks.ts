import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, publicApi, setAuthToken } from "../Config/Api";

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

export const adminSignin = createAsyncThunk(
  "adminAuth/signin",
  async (
    payload: {
      email: string;
      password: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await publicApi.post("/api/admin/auth/login", payload);
      if (response.data?.jwt) {
        setAuthToken(response.data.jwt, "admin" as any);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Admin login failed"));
    }
  },
);

export const adminSignup = createAsyncThunk(
  "adminAuth/signup",
  async (
    payload: {
      fullName: string;
      email: string;
      mobileNumber: string;
      password: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await publicApi.post("/api/admin/auth/signup", payload);
      if (response.data?.jwt) {
        setAuthToken(response.data.jwt, "admin" as any);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Admin signup failed"));
    }
  },
);

export const getAdminProfile = createAsyncThunk(
  "adminAuth/profile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/admin/profile");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to load admin profile"));
    }
  },
);

export const adminLogout = createAsyncThunk(
  "adminAuth/logout",
  async (navigate: any, { rejectWithValue }) => {
    try {
      setAuthToken(null);
      if (navigate) navigate("/admin/login");
      return true;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, "Failed to logout"));
    }
  },
);
