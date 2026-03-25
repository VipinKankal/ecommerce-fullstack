import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  sendLoginSignupOtp,
  signinSeller,
  registerSeller,
  verifySellerEmail,
  fetchSellerProfile,
  requestSellerEmailChangeOtp,
  updateSellerProfile,
  verifySellerEmailChangeOtp,
  logout,
} from './SellerAuthThunks';
import {
  signinCustomer,
  logout as customerLogout,
} from 'State/features/customer/auth/thunks';
import { adminLogout, adminSignin } from 'State/features/admin/auth/thunks';

interface SellerProfile {
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
}

interface SellerAuthState {
  profile: SellerProfile | null;
  otpSent: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: SellerAuthState = {
  profile: null,
  otpSent: false,
  loading: false,
  error: null,
  message: null,
};

const sellerAuthSlice = createSlice({
  name: 'sellerAuth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
      state.message = null;
    },
    resetSellerAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendLoginSignupOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendLoginSignupOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
        state.message = 'OTP Sent Successfully';
      })
      .addCase(sendLoginSignupOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(signinSeller.pending, (state) => {
        state.loading = true;
      })
      .addCase(signinSeller.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = false;
      })
      .addCase(signinSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(registerSeller.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerSeller.fulfilled, (state) => {
        state.loading = false;
        state.message = 'Seller account created successfully';
      })
      .addCase(registerSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(verifySellerEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifySellerEmail.fulfilled, (state) => {
        state.loading = false;
        state.message = 'Email verified successfully. Please login.';
      })
      .addCase(verifySellerEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(
        fetchSellerProfile.fulfilled,
        (state, action: PayloadAction<SellerProfile>) => {
          state.profile = action.payload;
        },
      )
      .addCase(updateSellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateSellerProfile.fulfilled,
        (state, action: PayloadAction<SellerProfile>) => {
          state.loading = false;
          state.profile = action.payload;
          state.message = 'Seller profile updated successfully';
        },
      )
      .addCase(updateSellerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(requestSellerEmailChangeOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestSellerEmailChangeOtp.fulfilled, (state) => {
        state.loading = false;
        state.message = 'OTP sent to the new seller email';
      })
      .addCase(requestSellerEmailChangeOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifySellerEmailChangeOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifySellerEmailChangeOtp.fulfilled, (state) => {
        state.loading = false;
        state.message = 'Seller email updated successfully';
      })
      .addCase(verifySellerEmailChangeOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSellerProfile.rejected, (state) => {
        state.profile = null;
      })

      .addCase(logout.fulfilled, (state) => {
        state.profile = null;
      })

      .addCase(signinCustomer.fulfilled, (state) => {
        state.profile = null;
      })
      .addCase(customerLogout.fulfilled, (state) => {
        state.profile = null;
      })
      .addCase(adminSignin.fulfilled, (state) => {
        state.profile = null;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.profile = null;
      });
  },
});

export const { clearAuthError, resetSellerAuthState } = sellerAuthSlice.actions;
export default sellerAuthSlice.reducer;
