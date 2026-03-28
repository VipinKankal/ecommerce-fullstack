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
  activeDeviceCount?: number;
  loginHistory?: Array<{
    device?: string;
    ipAddress?: string;
    loginAt?: string;
    logoutAt?: string;
    active?: boolean;
  }>;
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
    activeDeviceCount:
      typeof record.activeDeviceCount === 'number'
        ? record.activeDeviceCount
        : undefined,
    loginHistory: Array.isArray(record.loginHistory)
      ? record.loginHistory
          .filter((entry) => entry && typeof entry === 'object')
          .map((entry) => {
            const item = entry as Record<string, unknown>;
            return {
              device:
                typeof item.device === 'string' ? item.device : undefined,
              ipAddress:
                typeof item.ipAddress === 'string' ? item.ipAddress : undefined,
              loginAt:
                typeof item.loginAt === 'string' ? item.loginAt : undefined,
              logoutAt:
                typeof item.logoutAt === 'string' ? item.logoutAt : undefined,
              active: typeof item.active === 'boolean' ? item.active : undefined,
            };
          })
      : undefined,
  };
};

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
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

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Active Devices
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {profile?.activeDeviceCount ?? 0}
            </Typography>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Latest Login
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {formatDateTime(profile?.loginHistory?.[0]?.loginAt)}
            </Typography>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
          <Typography variant="overline" sx={{ fontWeight: 700 }}>
            Recent Login Activity
          </Typography>
          {profile?.loginHistory && profile.loginHistory.length > 0 ? (
            <div className="mt-3 space-y-2">
              {profile.loginHistory.slice(0, 6).map((entry, index) => (
                <div
                  key={`${entry.loginAt || 'login'}-${index}`}
                  className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {entry.device || 'Unknown Device'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.ipAddress || 'IP unavailable'}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">
                      Login: {formatDateTime(entry.loginAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {entry.active
                        ? 'Status: Active'
                        : `Status: Logged out ${formatDateTime(entry.logoutAt)}`}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No login history available yet.
            </Typography>
          )}
        </div>
      </Paper>
    </div>
  );
};

export default AdminAccount;
