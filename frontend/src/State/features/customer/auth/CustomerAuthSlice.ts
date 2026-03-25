import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  addUserAddress,
  deactivateAccount,
  deleteUserAddress,
  logout,
  getUserProfile,
  signinCustomer,
  sendOtp,
  register,
  updateUserAddress,
  updateUserProfile,
} from './CustomerLogin';
import { Address } from 'shared/types/user.types';
import {
  signinSeller,
  logout as sellerLogout,
} from 'State/features/seller/auth/thunks';
import { adminLogout, adminSignin } from 'State/features/admin/auth/thunks';

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  mobileNumber?: string;
  accountStatus?: string;
  role: string;
  addresses?: Address[];
}

interface AuthState {
  user: UserProfile | null;
  otpSent: boolean;
  loading: boolean;
  error: string | null;
  role: string | null;
  message?: string | null;
}

const initialState: AuthState = {
  user: null,
  otpSent: false,
  loading: false,
  error: null,
  role: null,
  message: null,
};

const customerAuthSlice = createSlice({
  name: 'customerAuth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOtp: (state) => {
      state.otpSent = false;
    },
    resetCustomerAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
        state.message = 'OTP Sent Successfully';
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = false;
        state.message = 'Registration Successful';
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(signinCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signinCustomer.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = false;
      })
      .addCase(signinCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(
        getUserProfile.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.user = action.payload;
        },
      )
      .addCase(
        updateUserProfile.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.user = action.payload;
        },
      )
      .addCase(
        addUserAddress.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.user = action.payload;
        },
      )
      .addCase(
        updateUserAddress.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.user = action.payload;
        },
      )
      .addCase(
        deleteUserAddress.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.user = action.payload;
        },
      )
      .addCase(getUserProfile.rejected, (state) => {
        state.user = null;
      })
      .addCase(deactivateAccount.fulfilled, (state, action) => {
        state.message =
          (action.payload as { message?: string })?.message ||
          'Account deactivated';
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.otpSent = false;
      })

      .addCase(signinSeller.fulfilled, (state) => {
        state.user = null;
        state.otpSent = false;
      })
      .addCase(sellerLogout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(adminSignin.fulfilled, (state) => {
        state.user = null;
        state.otpSent = false;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { clearError, resetOtp, resetCustomerAuthState } =
  customerAuthSlice.actions;
export default customerAuthSlice.reducer;
