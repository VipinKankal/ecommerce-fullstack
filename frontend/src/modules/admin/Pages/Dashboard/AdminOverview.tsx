import React, { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../State/Store";
import {
  adminDashboardSummary,
  adminSalesReport,
  adminPaymentsList,
  sellersList,
} from "../../../State/Backend/MasterApiThunks";

const AdminOverview = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector((state) => state.masterApi);
  const profile = useAppSelector((state) => state.adminAuth.user);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    dispatch(adminDashboardSummary());
    dispatch(adminSalesReport());
    dispatch(sellersList(undefined));
    dispatch(adminPaymentsList());
  }, [dispatch]);

  const sellers = Array.isArray(responses.sellersList) ? responses.sellersList : [];
  const transactions = Array.isArray(responses.adminPaymentsList) ? responses.adminPaymentsList : [];
  const dashboardSummary = responses.adminDashboardSummary;
  const salesReport = responses.adminSalesReport;

  const stats = useMemo(() => {
    return {
      totalSellers: dashboardSummary?.totalSellers || sellers.length,
      activeSellers:
        dashboardSummary?.activeSellers ||
        sellers.filter((seller: any) => seller.accountStatus === "ACTIVE").length,
      pendingSellers:
        dashboardSummary?.pendingSellers ||
        sellers.filter((seller: any) => seller.accountStatus === "PENDING_VERIFICATION").length,
      suspendedSellers: sellers.filter((seller: any) => seller.accountStatus === "SUSPENDED").length,
      transactionCount: dashboardSummary?.totalTransactions || transactions.length,
      grossValue: dashboardSummary?.grossMerchandiseValue || salesReport?.totalRevenue || 0,
    };
  }, [dashboardSummary, salesReport, sellers, transactions]);

  const latestTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              {profile?.fullName || "Operations Control Center"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Track seller activation, platform transactions, and approval workload from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile?.role && <Chip label={profile.role} color="info" />}
            <Chip
              label={`${stats.transactionCount} transactions`}
              variant="outlined"
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.24)" }}
            />
          </div>
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            title: "Total Sellers",
            value: stats.totalSellers,
            icon: <Groups2OutlinedIcon />,
            tone: "bg-slate-50 text-slate-700 border-slate-100",
          },
          {
            title: "Active Sellers",
            value: stats.activeSellers,
            icon: <StorefrontOutlinedIcon />,
            tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
          },
          {
            title: "Pending Approval",
            value: stats.pendingSellers,
            icon: <PendingActionsOutlinedIcon />,
            tone: "bg-amber-50 text-amber-700 border-amber-100",
          },
          {
            title: "Suspended Sellers",
            value: stats.suspendedSellers,
            icon: <SyncAltOutlinedIcon />,
            tone: "bg-rose-50 text-rose-700 border-rose-100",
          },
          {
            title: "Platform GMV",
            value: `Rs ${stats.grossValue}`,
            icon: <CurrencyRupeeOutlinedIcon />,
            tone: "bg-violet-50 text-violet-700 border-violet-100",
          },
        ].map((card) => (
          <div key={card.title} className={`rounded-3xl border p-5 shadow-sm ${card.tone}`}>
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-2xl bg-white/80 p-3 shadow-sm">{card.icon}</span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Overview</p>
            </div>
            <p className="text-sm font-semibold opacity-80">{card.title}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {loading && !sellers.length && !transactions.length && (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Paper sx={{ p: 3, borderRadius: "24px", boxShadow: "none", border: "1px solid #eef2f7" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Latest Transactions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment-linked orders currently available to admin monitoring.
              </Typography>
            </div>
            <Button component={Link} to="/admin/transactions" variant="outlined">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {latestTransactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No transaction data available yet.
              </Typography>
            ) : (
              latestTransactions.map((row: any) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      #{row.id} | {row.customerName || row.customerEmail || "Customer"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Seller: {row.sellerName || "N/A"}
                    </Typography>
                  </div>
                  <div className="text-left sm:text-right">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Rs {row.amount || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.date ? new Date(row.date).toLocaleString() : "-"}
                    </Typography>
                  </div>
                </div>
              ))
            )}
          </div>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: "24px", boxShadow: "none", border: "1px solid #eef2f7" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Operational Next Steps
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Current backend supports seller oversight and transaction visibility. User, product moderation, and reports still need dedicated admin APIs.
          </Typography>

          <div className="space-y-3">
            {[
              "Review pending seller approvals",
              "Monitor payment-linked orders",
              "Add admin APIs for product and order moderation",
              "Build reporting endpoints for analytics",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                {item}
              </div>
            ))}
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default AdminOverview;
