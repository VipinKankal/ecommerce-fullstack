import React, { useEffect } from 'react';
import { Alert, CircularProgress, Paper, Typography } from '@mui/material';
import { adminSalesReport } from 'State/backend/MasterApiThunks';
import { useAppDispatch, useAppSelector } from 'app/store/Store';

type LeaderboardItem = {
  label: string;
  value: number;
};

type AdminSalesReportResponse = {
  totalRevenue?: number;
  totalOrders?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  totalTransactions?: number;
  topCategories: LeaderboardItem[];
  topSellers: LeaderboardItem[];
};

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' ? value : fallback;

const toLeaderboard = (value: unknown): LeaderboardItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      if (typeof record.label !== 'string') {
        return null;
      }
      return {
        label: record.label,
        value: toNumber(record.value),
      };
    })
    .filter((entry): entry is LeaderboardItem => entry !== null);
};

const toSalesReport = (payload: unknown): AdminSalesReportResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  return {
    totalRevenue: toNumber(record.totalRevenue),
    totalOrders: toNumber(record.totalOrders),
    deliveredOrders: toNumber(record.deliveredOrders),
    cancelledOrders: toNumber(record.cancelledOrders),
    totalTransactions: toNumber(record.totalTransactions),
    topCategories: toLeaderboard(record.topCategories),
    topSellers: toLeaderboard(record.topSellers),
  };
};

const AdminReports = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const report = toSalesReport(responses.adminSalesReport);
  const topCategories = report?.topCategories ?? [];
  const topSellers = report?.topSellers ?? [];

  useEffect(() => {
    dispatch(adminSalesReport());
  }, [dispatch]);

  if (loading && !report) {
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
          Sales Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Platform-level revenue and leaderboard summary.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { title: 'Revenue', value: `Rs ${report?.totalRevenue || 0}` },
          { title: 'Orders', value: report?.totalOrders || 0 },
          { title: 'Delivered', value: report?.deliveredOrders || 0 },
          { title: 'Cancelled', value: report?.cancelledOrders || 0 },
          { title: 'Transactions', value: report?.totalTransactions || 0 },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Report
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {card.title}
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Paper
          sx={{
            p: 3,
            borderRadius: '24px',
            boxShadow: 'none',
            border: '1px solid #eef2f7',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Top Categories
          </Typography>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No category report data.
              </Typography>
            ) : (
              topCategories.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))
            )}
          </div>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: '24px',
            boxShadow: 'none',
            border: '1px solid #eef2f7',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Top Sellers
          </Typography>
          <div className="space-y-3">
            {topSellers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No seller report data.
              </Typography>
            ) : (
              topSellers.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))
            )}
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default AdminReports;
