import React from 'react';
import { Alert, Button, Chip, CircularProgress, Divider } from '@mui/material';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import LockIcon from '@mui/icons-material/Lock';
import { useAppDispatch } from 'app/store/Store';
import EmailChangePanel from 'features/customer/account-profile/components/EmailChangePanel';
import { resolveEmailFlowMessage } from 'features/customer/account-profile/components/profileHelpers';
import {
  fetchSellerProfile,
  requestSellerEmailChangeOtp,
  verifySellerEmailChangeOtp,
} from 'State/features/seller/auth/thunks';
import SellerProfileFormSections from '../components/SellerProfileFormSections';
import { useSellerProfile } from '../hooks/useSellerProfile';

const SellerProfilePage = () => {
  const dispatch = useAppDispatch();
  const {
    error,
    form,
    handleCancel,
    handleSave,
    handleSetIsEditing,
    isEditing,
    loading,
    localError,
    localSuccess,
    message,
    profile,
    updateRoot,
    updateSection,
  } = useSellerProfile();
  const [newEmail, setNewEmail] = React.useState('');
  const [emailOtp, setEmailOtp] = React.useState('');
  const [emailOtpSent, setEmailOtpSent] = React.useState(false);
  const [otpRequestedFor, setOtpRequestedFor] = React.useState('');
  const [emailFlowMessage, setEmailFlowMessage] = React.useState<string | null>(
    null,
  );
  const [showEmailChangeForm, setShowEmailChangeForm] = React.useState(false);
  const [otpError, setOtpError] = React.useState<string | null>(null);

  const normalizedEmail = newEmail.trim().toLowerCase();
  const currentEmail = (profile?.email || '').trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const canSendOtp =
    isValidEmail &&
    normalizedEmail.length > 0 &&
    normalizedEmail !== currentEmail &&
    !loading;
  const canVerifyOtp =
    canSendOtp &&
    emailOtp.trim().length > 0 &&
    emailOtpSent &&
    otpRequestedFor === normalizedEmail &&
    !loading;
  const shouldShowOtpInput =
    emailOtpSent && otpRequestedFor === normalizedEmail;

  const handleRequestEmailOtp = async () => {
    setEmailFlowMessage(null);
    setOtpError(null);
    try {
      if (!normalizedEmail) {
        setEmailFlowMessage('Please enter a new seller email.');
        return;
      }
      if (normalizedEmail === currentEmail) {
        setEmailFlowMessage('New email must be different from current email.');
        return;
      }
      await dispatch(requestSellerEmailChangeOtp(normalizedEmail)).unwrap();
      setEmailOtpSent(true);
      setOtpRequestedFor(normalizedEmail);
      setEmailOtp('');
      setEmailFlowMessage('OTP sent to the new seller email.');
    } catch (requestError: unknown) {
      setEmailFlowMessage(
        resolveEmailFlowMessage(requestError, 'Failed to send OTP').message,
      );
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailFlowMessage(null);
    setOtpError(null);
    try {
      if (!normalizedEmail || !emailOtp.trim()) {
        setEmailFlowMessage('Please enter email and OTP.');
        return;
      }
      if (otpRequestedFor !== normalizedEmail) {
        setEmailFlowMessage(
          'Email input changed. Request OTP again for this email.',
        );
        return;
      }
      await dispatch(
        verifySellerEmailChangeOtp({
          newEmail: normalizedEmail,
          otp: emailOtp.trim(),
        }),
      ).unwrap();
      await dispatch(fetchSellerProfile()).unwrap();
      setEmailFlowMessage(
        'Primary seller email updated successfully. You are still logged in.',
      );
      setEmailOtp('');
      setEmailOtpSent(false);
      setOtpRequestedFor('');
      setShowEmailChangeForm(false);
      setNewEmail('');
    } catch (requestError: unknown) {
      const resolved = resolveEmailFlowMessage(
        requestError,
        'OTP verification failed',
      );
      if (resolved.type === 'otp') {
        setOtpError(resolved.message);
      } else {
        setEmailFlowMessage(resolved.message);
      }
    }
  };

  const handleEmailInputChange = (value: string) => {
    const nextEmail = value.trim().toLowerCase();
    setNewEmail(value);

    if (otpRequestedFor && otpRequestedFor !== nextEmail) {
      setEmailOtpSent(false);
      setEmailOtp('');
      setOtpError(null);
      setEmailFlowMessage('Email changed. Request OTP again for the new email.');
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center py-16">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Seller Account
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              {form.storeDetails.storeName || form.sellerName || 'Seller Profile'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Personal, business, address, payout, KYC, and store support
              information for seller operations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip
              icon={
                profile?.emailVerified ? (
                  <VerifiedRoundedIcon />
                ) : (
                  <PendingOutlinedIcon />
                )
              }
              label={
                profile?.emailVerified
                  ? 'Email Verified'
                  : 'Verification Pending'
              }
              color={profile?.emailVerified ? 'success' : 'warning'}
            />
            <Chip
              label={profile?.accountStatus || 'PENDING_VERIFICATION'}
              color={profile?.accountStatus === 'ACTIVE' ? 'success' : 'warning'}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.24)' }}
            />
            {profile?.role && (
              <Chip
                label={profile.role}
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.24)' }}
              />
            )}
          </div>
        </div>
      </div>

      {(error || localError || localSuccess || message) && (
        <Alert severity={error || localError ? 'error' : 'success'}>
          {error || localError || localSuccess || message}
        </Alert>
      )}
      {emailFlowMessage && !loading && (
        <Alert
          severity={
            emailFlowMessage.toLowerCase().includes('failed') ||
            emailFlowMessage.toLowerCase().includes('invalid')
              ? 'error'
              : 'success'
          }
        >
          {emailFlowMessage}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-900">
            Seller Information
          </h2>
          <p className="text-sm text-gray-500">
            This structure matches production-level seller onboarding and profile
            maintenance.
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing && (
            <Button variant="outlined" color="inherit" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={isEditing ? handleSave : () => handleSetIsEditing(true)}
            disabled={loading}
            sx={{
              borderRadius: '999px',
              px: 3,
              bgcolor: '#0f172a',
              '&:hover': { bgcolor: '#020617' },
            }}
          >
            {loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Edit Profile'
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <LockIcon fontSize="small" />
              <h2 className="text-lg font-black tracking-tight">
                Seller Login & Business Contact
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Primary email is used for seller OTP login. Business support email,
              phone, and pickup address remain your store contact details.
            </p>
          </div>
          {profile?.emailVerified && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Verified
            </span>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Primary Seller Email
          </p>
          <p className="mt-2 break-all text-base font-semibold text-slate-900">
            {profile?.email || form.email || 'N/A'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            After verifying a new email, you stay logged in and future seller
            logins use the updated email.
          </p>
        </div>

        {!showEmailChangeForm ? (
          <Button
            variant="outlined"
            sx={{ mt: 3 }}
            onClick={() => setShowEmailChangeForm(true)}
          >
            Change Primary Email
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <EmailChangePanel
              loading={loading}
              newEmail={newEmail}
              emailOtp={emailOtp}
              isValidEmail={isValidEmail}
              canSendOtp={canSendOtp}
              canVerifyOtp={canVerifyOtp}
              shouldShowOtpInput={shouldShowOtpInput}
              otpRequestedFor={otpRequestedFor}
              emailFlowMessage={null}
              otpError={otpError}
              onEmailChange={handleEmailInputChange}
              onOtpChange={(value) => {
                setEmailOtp(value);
                if (otpError) setOtpError(null);
              }}
              onRequestOtp={handleRequestEmailOtp}
              onVerifyOtp={handleVerifyEmailOtp}
            />
            <Button
              size="small"
              color="inherit"
              onClick={() => setShowEmailChangeForm(false)}
            >
              Cancel Change
            </Button>
          </div>
        )}
      </div>

      <SellerProfileFormSections
        form={form}
        isEditing={isEditing}
        updateRoot={updateRoot}
        updateSection={updateSection}
      />

      <Divider />
    </div>
  );
};

export default SellerProfilePage;
