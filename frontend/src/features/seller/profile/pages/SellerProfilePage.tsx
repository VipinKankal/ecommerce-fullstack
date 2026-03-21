import React from 'react';
import { Alert, Button, Chip, CircularProgress, Divider } from '@mui/material';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import SellerProfileFormSections from '../components/SellerProfileFormSections';
import { useSellerProfile } from '../hooks/useSellerProfile';

const SellerProfilePage = () => {
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
              {form.storeDetails.storeName ||
                form.sellerName ||
                'Seller Profile'}
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
              color={
                profile?.accountStatus === 'ACTIVE' ? 'success' : 'warning'
              }
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-900">
            Seller Information
          </h2>
          <p className="text-sm text-gray-500">
            This structure matches production-level seller onboarding and
            profile maintenance.
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
