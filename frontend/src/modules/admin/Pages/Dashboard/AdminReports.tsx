import React, { useEffect } from "react";
import { Alert, CircularProgress, Paper, Typography } from "@mui/material";
import { adminSalesReport } from "../../../State/Backend/MasterApiThunks";
import { useAppDispatch, useAppSelector } from "../../../State/Store";

const AdminReports = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector((state) => state.masterApi);
  const report = responses.adminSalesReport;

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
          { title: "Revenue", value: `Rs ${report?.totalRevenue || 0}` },
          { title: "Orders", value: report?.totalOrders || 0 },
          { title: "Delivered", value: report?.deliveredOrders || 0 },
          { title: "Cancelled", value: report?.cancelledOrders || 0 },
          { title: "Transactions", value: report?.totalTransactions || 0 },
        ].map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Report</p>
            <p className="mt-3 text-sm font-semibold text-slate-600">{card.title}</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Paper sx={{ p: 3, borderRadius: "24px", boxShadow: "none", border: "1px solid #eef2f7" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Top Categories
          </Typography>
          <div className="space-y-3">
            {(report?.topCategories || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No category report data.</Typography>
            ) : (
              report.topCategories.map((item: any, index: number) => (
                <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))
            )}
          </div>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: "24px", boxShadow: "none", border: "1px solid #eef2f7" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Top Sellers
          </Typography>
          <div className="space-y-3">
            {(report?.topSellers || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No seller report data.</Typography>
            ) : (
              report.topSellers.map((item: any, index: number) => (
                <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
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
