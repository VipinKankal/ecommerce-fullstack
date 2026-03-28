import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Divider } from '@mui/material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import LockIcon from '@mui/icons-material/Lock';
import {
  getUserProfile,
  requestEmailChangeOtp,
  updateUserProfile,
  verifyEmailChangeOtp,
} from 'State/features/customer/auth/thunks';
import EmailChangePanel from '../components/EmailChangePanel';
import ProfileEditForm from '../components/ProfileEditForm';
import ProfileSummary from '../components/ProfileSummary';
import {
  resolveEmailFlowMessage,
  validateProfileDetails,
} from '../components/profileHelpers';
import { getErrorMessage } from 'shared/errors/apiError';

type UserDetailsMode = 'profile' | 'full';

interface UserDetailsProps {
  mode?: UserDetailsMode;
}

const UserDetails = ({ mode = 'full' }: UserDetailsProps) => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector(
    (state) => state.customerAuth,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otpRequestedFor, setOtpRequestedFor] = useState('');
  const [emailFlowMessage, setEmailFlowMessage] = useState<string | null>(null);
  const [showEmailChangeForm, setShowEmailChangeForm] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<{
    fullName?: string;
    mobileNumber?: string;
  }>({});

  const normalizedEmail = newEmail.trim().toLowerCase();
  const currentEmail = (user?.email || '').trim().toLowerCase();
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

  useEffect(() => {
    if (!user) {
      dispatch(getUserProfile());
    }
  }, [dispatch, user]);

  

  const startEditing = () => {
    setFullName(user?.fullName || '');
    setMobileNumber(user?.mobileNumber || '');
    setProfileErrors({});
    setIsEditing(true);
  };

  const handleSave = async () => {
    const errors = validateProfileDetails(fullName, mobileNumber);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    await dispatch(
      updateUserProfile({
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
      }),
    ).unwrap();
    setIsEditing(false);
  };

  const handleRequestEmailOtp = async () => {
    setEmailFlowMessage(null);
    setOtpError(null);
    try {
      if (!normalizedEmail) {
        setEmailFlowMessage('Please enter new email.');
        return;
      }
      if (normalizedEmail === currentEmail) {
        setEmailFlowMessage('New email must be different from current email.');
        return;
      }
      await dispatch(requestEmailChangeOtp(normalizedEmail)).unwrap();
      setEmailOtpSent(true);
      setOtpRequestedFor(normalizedEmail);
      setEmailOtp('');
      setEmailFlowMessage('OTP sent to new email.');
    } catch (error: unknown) {
      setEmailFlowMessage(getErrorMessage(error, 'Failed to send OTP'));
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
      if (normalizedEmail === currentEmail) {
        setEmailFlowMessage('New email must be different from current email.');
        return;
      }
      if (otpRequestedFor !== normalizedEmail) {
        setEmailFlowMessage(
          'Email input changed. Request OTP again for this email.',
        );
        return;
      }
      await dispatch(
        verifyEmailChangeOtp({
          newEmail: normalizedEmail,
          otp: emailOtp.trim(),
        }),
      ).unwrap();
      await dispatch(getUserProfile()).unwrap();
      setEmailFlowMessage(
        'Email updated successfully. You are still logged in.',
      );
      setEmailOtp('');
      setEmailOtpSent(false);
      setOtpRequestedFor('');
      setShowEmailChangeForm(false);
      setNewEmail('');
    } catch (error: unknown) {
      const resolved = resolveEmailFlowMessage(
        error,
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
      setEmailFlowMessage(
        'Email changed. Request OTP again for the new email.',
      );
    }
  };
  const location = useMemo(
    () =>
      user?.addresses?.[0]
        ? `${user.addresses[0].city}, ${user.addresses[0].state}`
        : 'Not Set',
    [user?.addresses],
  );

  const emailChangePanel = (
    <EmailChangePanel
      loading={loading}
      newEmail={newEmail}
      emailOtp={emailOtp}
      isValidEmail={isValidEmail}
      canSendOtp={canSendOtp}
      canVerifyOtp={canVerifyOtp}
      shouldShowOtpInput={shouldShowOtpInput}
      otpRequestedFor={otpRequestedFor}
      emailFlowMessage={emailFlowMessage}
      otpError={otpError}
      onEmailChange={handleEmailInputChange}
      onOtpChange={(value) => {
        setEmailOtp(value);
        if (otpError) setOtpError(null);
      }}
      onRequestOtp={handleRequestEmailOtp}
      onVerifyOtp={handleVerifyEmailOtp}
    />
  );

  if (!user) return <Alert severity="info">Loading profile...</Alert>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#282c3f]">
        Profile Details
      </h1>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="border border-gray-300 p-4 sm:p-7" id="profile">
        <h2 className="text-lg font-semibold text-[#282c3f] mb-4 sm:mb-6">
          {isEditing ? 'Edit Details' : 'Profile Details'}
        </h2>
        <Divider sx={{ mb: 3 }} />
        {!isEditing ? (
          <ProfileSummary
            fullName={user.fullName}
            mobileNumber={user.mobileNumber}
            email={user.email}
            location={location}
            onEdit={startEditing}
          />
        ) : (
          <ProfileEditForm
            fullName={fullName}
            mobileNumber={mobileNumber}
            loading={loading}
            fullNameError={profileErrors.fullName}
            mobileNumberError={profileErrors.mobileNumber}
            showEmailChangeForm={showEmailChangeForm}
            emailPanel={emailChangePanel}
            onFullNameChange={(value) => {
              setFullName(value);
              if (profileErrors.fullName) {
                setProfileErrors((prev) => ({ ...prev, fullName: undefined }));
              }
            }}
            onMobileNumberChange={(value) => {
              setMobileNumber(value);
              if (profileErrors.mobileNumber) {
                setProfileErrors((prev) => ({
                  ...prev,
                  mobileNumber: undefined,
                }));
              }
            }}
            onCancel={() => {
              setIsEditing(false);
              setProfileErrors({});
              setFullName(user.fullName || '');
              setMobileNumber(user.mobileNumber || '');
            }}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Login Security Section */}
      {mode === 'full' && !isEditing && (
        <section className="pt-2 border-t border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
            <LockIcon className="text-blue-600" />
            Login & Security
          </h2>

          <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 gap-2">
              <div>
                <p className="font-semibold text-gray-700 text-sm sm:text-base">
                  Primary Email
                </p>
                <p className="text-gray-500 text-sm break-all">{user.email}</p>
              </div>
              <span className="mt-1 md:mt-0 px-2.5 py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-bold rounded-full uppercase">
                Verified
              </span>
            </div>

            {!showEmailChangeForm ? (
              <Button
                variant="outlined"
                size="small"
                color="primary"
                onClick={() => setShowEmailChangeForm(true)}
                sx={{ fontWeight: 700, fontSize: '0.75rem', px: 1.5, py: 0.75 }}
              >
                Change Email Address?
              </Button>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2">
                <Divider sx={{ my: 2 }} />
                {emailChangePanel}
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setShowEmailChangeForm(false)}
                  sx={{ mt: 1.5, fontSize: '0.72rem' }}
                >
                  Cancel Change
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default UserDetails;
