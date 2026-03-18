import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  adminLogout,
  adminSignup,
  adminSignin,
  getAdminProfile,
} from "./AdminAuthThunks";
import { signinCustomer, logout as customerLogout } from "./CustomerLogin/CustomerLogin";
import { logout as sellerLogout, signinSeller } from "./Seller/SellerAuthThunks";

interface AdminProfile {
  id: number;
  fullName: string;
  email: string;
  mobileNumber?: string;
  role?: string;
}

interface AdminAuthState {
  user: AdminProfile | null;
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: AdminAuthState = {
  user: null,
  loading: false,
  error: null,
  message: null,
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    clearAdminAuthError: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminSignup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminSignup.fulfilled, (state) => {
        state.loading = false;
        state.message = "Admin signup successful";
      })
      .addCase(adminSignup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(adminSignin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminSignin.fulfilled, (state) => {
        state.loading = false;
        state.message = "Admin login successful";
      })
      .addCase(adminSignin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAdminProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminProfile.fulfilled, (state, action: PayloadAction<AdminProfile>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload as string;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.user = null;
        state.message = null;
      })
      .addCase(signinCustomer.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(customerLogout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(signinSeller.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(sellerLogout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { clearAdminAuthError } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
