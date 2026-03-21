import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { adminProfile } from 'State/backend/MasterApiThunks';

type AdminProfileResponse = {
  fullName?: string;
  role?: string;
  email?: string;
  mobileNumber?: string;
};

const toAdminProfile = (payload: unknown): AdminProfileResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  return {
    fullName: typeof record.fullName === 'string' ? record.fullName : undefined,
    role: typeof record.role === 'string' ? record.role : undefined,
    email: typeof record.email === 'string' ? record.email : undefined,
    mobileNumber:
      typeof record.mobileNumber === 'string' ? record.mobileNumber : undefined,
  };
};

const AdminAccount = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const profile = useMemo(
    () => toAdminProfile(responses.adminProfile),
    [responses.adminProfile],
  );

  useEffect(() => {
    dispatch(adminProfile());
  }, [dispatch]);

  if (loading && !profile) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Admin Account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current authenticated admin identity and access context.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        sx={{
          p: 4,
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {profile?.fullName || 'Admin User'}
          </Typography>
          {profile?.role && <Chip label={profile.role} color="info" />}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Full Name
            </Typography>
            <Typography variant="body1">
              {profile?.fullName || 'N/A'}
            </Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Email
            </Typography>
            <Typography variant="body1">{profile?.email || 'N/A'}</Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Mobile Number
            </Typography>
            <Typography variant="body1">
              {profile?.mobileNumber || 'N/A'}
            </Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Access Level
            </Typography>
            <Typography variant="body1">{profile?.role || 'N/A'}</Typography>
          </div>
        </div>
      </Paper>
    </div>
  );
};

export default AdminAccount;
