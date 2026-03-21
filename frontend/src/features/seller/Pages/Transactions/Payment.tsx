import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { sellerTransactions } from 'State/backend/MasterApiThunks';
import Transaction from './Transaction';

type SellerTransactionRow = {
  id?: number | string;
  amount?: number | string;
  date?: string;
  customerEmail?: string;
  customerName?: string;
};

const Payment = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const rawTransactions = responses.sellerTransactions;

  useEffect(() => {
    dispatch(sellerTransactions());
  }, [dispatch]);

  const stats = useMemo(() => {
    const rows = Array.isArray(rawTransactions)
      ? (rawTransactions as SellerTransactionRow[])
      : [];
    const totalTransactions = rows.length;
    const totalOrdersValue = rows.reduce(
      (sum: number, row: SellerTransactionRow) => sum + Number(row.amount || 0),
      0,
    );
    const latest = rows[0] || null;
    const lastPaymentAmount = Number(latest?.amount || 0);
    const uniqueCustomers = new Set(
      rows.map(
        (row: SellerTransactionRow) =>
          row.customerEmail || row.customerName || row.id,
      ),
    ).size;

    return {
      totalTransactions,
      totalOrdersValue,
      lastPaymentAmount,
      uniqueCustomers,
      latestDate: latest?.date || null,
    };
  }, [rawTransactions]);

  return (
    <Box sx={{ p: { xs: 2, lg: 3 } }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Earnings',
            value: `Rs ${stats.totalOrdersValue}`,
            icon: <AccountBalanceWalletIcon />,
            tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          },
          {
            title: 'Transactions',
            value: stats.totalTransactions,
            icon: <ReceiptLongOutlinedIcon />,
            tone: 'bg-blue-50 text-blue-700 border-blue-100',
          },
          {
            title: 'Last Payment',
            value: `Rs ${stats.lastPaymentAmount}`,
            icon: <PaymentsOutlinedIcon />,
            tone: 'bg-violet-50 text-violet-700 border-violet-100',
          },
          {
            title: 'Unique Customers',
            value: stats.uniqueCustomers,
            icon: <ReceiptLongOutlinedIcon />,
            tone: 'bg-amber-50 text-amber-700 border-amber-100',
          },
        ].map((card) => (
          <div
            key={card.title}
            className={`rounded-3xl border p-5 shadow-sm ${card.tone}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-2xl bg-white/80 p-3 shadow-sm">
                {card.icon}
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                Payments
              </p>
            </div>
            <p className="text-sm font-semibold opacity-80">{card.title}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Card
        sx={{
          p: 3,
          borderRadius: 4,
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Seller Payout Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This section reflects payment-linked order transactions currently
              available in the system.
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip
              color="info"
              variant="outlined"
              label={
                stats.latestDate
                  ? `Latest transaction: ${new Date(stats.latestDate).toLocaleDateString()}`
                  : 'No transaction yet'
              }
            />
            <Button
              variant="contained"
              disableElevation
              sx={{ borderRadius: 999, px: 3 }}
            >
              Request Withdrawal
            </Button>
          </div>
        </div>

        <Divider sx={{ my: 3 }} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Settlement Readiness
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ensure bank details, GST, and KYC are fully updated before payout
              release.
            </Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Payout Basis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Earnings shown here are derived from seller-linked order
              transactions.
            </Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Current Limitation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dedicated payout ledger is not yet implemented, so this is an
              operational summary.
            </Typography>
          </div>
        </div>
      </Card>

      {loading && !Array.isArray(rawTransactions) && (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      )}

      <Transaction />
    </Box>
  );
};

export default Payment;
