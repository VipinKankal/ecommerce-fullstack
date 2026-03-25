import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  sellerSettlementLedger,
  sellerSettlements,
} from 'State/backend/MasterApiThunks';
import Transaction from './Transaction';

type SellerSettlementRow = {
  id?: number | string;
  orderId?: number | string;
  paymentOrderId?: number | string;
  orderType?: string;
  settlementStatus?: string;
  grossCollectedAmount?: number | string;
  taxableValue?: number | string;
  gstAmount?: number | string;
  commissionAmount?: number | string;
  commissionGstAmount?: number | string;
  tcsRatePercentage?: number | string;
  tcsAmount?: number | string;
  sellerPayableAmount?: number | string;
  sellerGstLiabilityAmount?: number | string;
  currencyCode?: string;
  notes?: string;
  createdAt?: string;
};

type SellerLedgerRow = {
  id?: number | string;
  orderId?: number | string;
  entryGroup?: string;
  entryDirection?: string;
  accountName?: string;
  amount?: number | string;
  currencyCode?: string;
  note?: string;
  createdAt?: string;
};

const formatCurrency = (
  value: number | string | undefined,
  currencyCode?: string,
) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode || 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} ${date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}`;
};

const getSettlementTone = (
  status?: string,
): { color: ChipProps['color']; label: string } => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'READY_FOR_PAYOUT') {
    return { color: 'success', label: 'READY FOR PAYOUT' };
  }
  if (normalized === 'RETAINED') {
    return { color: 'info', label: 'RETAINED' };
  }
  return { color: 'default', label: normalized || 'UNKNOWN' };
};

const getLedgerTone = (
  direction?: string,
): { color: ChipProps['color']; label: string } => {
  const normalized = String(direction || '').toUpperCase();
  if (normalized === 'CREDIT') {
    return { color: 'success', label: 'CREDIT' };
  }
  if (normalized === 'DEBIT') {
    return { color: 'warning', label: 'DEBIT' };
  }
  return { color: 'default', label: normalized || 'MEMO' };
};

const Payment = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const rawSettlements = responses.sellerSettlements;
  const rawLedger = responses.sellerSettlementLedger;

  useEffect(() => {
    dispatch(sellerSettlements());
    dispatch(sellerSettlementLedger());
  }, [dispatch]);

  const settlements = useMemo(
    () =>
      Array.isArray(rawSettlements)
        ? (rawSettlements as SellerSettlementRow[])
        : [],
    [rawSettlements],
  );

  const ledgerEntries = useMemo(
    () => (Array.isArray(rawLedger) ? (rawLedger as SellerLedgerRow[]) : []),
    [rawLedger],
  );

  const stats = useMemo(() => {
    const totalGross = settlements.reduce(
      (sum, row) => sum + Number(row.grossCollectedAmount || 0),
      0,
    );
    const totalNetPayable = settlements.reduce(
      (sum, row) => sum + Number(row.sellerPayableAmount || 0),
      0,
    );
    const totalDeductions = settlements.reduce(
      (sum, row) =>
        sum +
        Number(row.commissionAmount || 0) +
        Number(row.commissionGstAmount || 0) +
        Number(row.tcsAmount || 0),
      0,
    );
    const totalSellerGst = settlements.reduce(
      (sum, row) => sum + Number(row.sellerGstLiabilityAmount || 0),
      0,
    );
    const latest = settlements[0] || null;

    return {
      totalOrders: settlements.length,
      totalGross,
      totalNetPayable,
      totalDeductions,
      totalSellerGst,
      latestDate: latest?.createdAt || null,
    };
  }, [settlements]);

  return (
    <Box sx={{ p: { xs: 2, lg: 3 } }} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Gross Collected',
            value: formatCurrency(stats.totalGross),
            icon: <AccountBalanceWalletIcon />,
            tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          },
          {
            title: 'Net Payable',
            value: formatCurrency(stats.totalNetPayable),
            icon: <PaymentsOutlinedIcon />,
            tone: 'bg-blue-50 text-blue-700 border-blue-100',
          },
          {
            title: 'Deductions',
            value: formatCurrency(stats.totalDeductions),
            icon: <ReceiptLongOutlinedIcon />,
            tone: 'bg-violet-50 text-violet-700 border-violet-100',
          },
          {
            title: 'Seller GST Liability',
            value: formatCurrency(stats.totalSellerGst),
            icon: <AccountTreeOutlinedIcon />,
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
                Settlements
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
              Settlement math now comes from frozen tax snapshot records, so you
              can reconcile gross collection, commission, commission GST, TCS,
              and final seller payout order by order.
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip
              color="info"
              variant="outlined"
              label={
                stats.latestDate
                  ? `Latest settlement: ${formatDateTime(stats.latestDate)}`
                  : 'No settlement yet'
              }
            />
            <Chip
              color="default"
              variant="outlined"
              label={`${stats.totalOrders} payout rows`}
            />
            <Chip
              color="success"
              variant="outlined"
              label={`${ledgerEntries.length} ledger entries`}
            />
          </div>
        </div>

        <Divider sx={{ my: 3 }} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Payout Formula
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Net payout = gross collected - commission - commission GST - TCS.
            </Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Seller GST
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Seller-facing GST liability stays visible separately so payout and
              GST do not get mixed together.
            </Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Ledger Proof
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Every successful payment now posts settlement rows plus ledger
              entries for reconciliation.
            </Typography>
          </div>
        </div>
      </Card>

      <Card
        sx={{
          p: 3,
          borderRadius: 4,
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Payout Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order-wise settlement rows with tax and deduction visibility.
            </Typography>
          </div>
          <Chip
            color="primary"
            variant="outlined"
            label="Gross - Commission - GST - TCS = Net"
          />
        </div>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            border: '1px solid #eef2f7',
            boxShadow: 'none',
          }}
        >
          <Table sx={{ minWidth: 1200 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Gross</TableCell>
                <TableCell>Commission</TableCell>
                <TableCell>Commission GST</TableCell>
                <TableCell>TCS</TableCell>
                <TableCell>Net Payable</TableCell>
                <TableCell>Seller GST</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settlements.map((row) => {
                const tone = getSettlementTone(row.settlementStatus);
                return (
                  <TableRow key={row.id || row.orderId} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        #{row.orderId || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.orderType || 'MARKETPLACE'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={tone.color}
                        label={tone.label}
                      />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        row.grossCollectedAmount,
                        row.currencyCode,
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(row.commissionAmount, row.currencyCode)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        row.commissionGstAmount,
                        row.currencyCode,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {formatCurrency(row.tcsAmount, row.currencyCode)}
                        </span>
                        <Typography variant="caption" color="text.secondary">
                          {Number(row.tcsRatePercentage || 0)}%
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {formatCurrency(
                        row.sellerPayableAmount,
                        row.currencyCode,
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        row.sellerGstLiabilityAmount,
                        row.currencyCode,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDateTime(row.createdAt)}</span>
                        {row.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {row.notes}
                          </Typography>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!settlements.length && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    {loading
                      ? 'Loading payout rows...'
                      : 'No settlements found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card
        sx={{
          p: 3,
          borderRadius: 4,
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="mb-4">
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Settlement Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posting trail for settlement accounts so payout math stays
            explainable.
          </Typography>
        </div>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            border: '1px solid #eef2f7',
            boxShadow: 'none',
          }}
        >
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Entry</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Posted At</TableCell>
                <TableCell>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerEntries.map((row) => {
                const tone = getLedgerTone(row.entryDirection);
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>#{row.orderId || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {row.entryGroup || 'MEMO'}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={tone.color}
                          label={tone.label}
                          sx={{ width: 'fit-content' }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{row.accountName || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {formatCurrency(row.amount, row.currencyCode)}
                    </TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                    <TableCell>{row.note || '-'}</TableCell>
                  </TableRow>
                );
              })}
              {!ledgerEntries.length && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {loading ? 'Loading ledger...' : 'No ledger entries found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {loading && !settlements.length && !ledgerEntries.length && (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      )}

      <Card
        sx={{
          p: 3,
          borderRadius: 4,
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Settlement Readiness
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bank details, GST, and KYC should stay up to date for payout
              release.
            </Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              TCS Visibility
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Seller can now see how much TCS was withheld per payout row.
            </Typography>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Historical Trail
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Raw customer-linked transaction history remains available below.
            </Typography>
          </div>
        </div>
      </Card>

      <Divider />

      <div>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Transaction History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Settlement rows above show payout math. The table below keeps raw
          customer-linked transaction history visible for operations.
        </Typography>
      </div>

      <Card
        sx={{
          p: 0,
          borderRadius: 4,
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <Transaction />
      </Card>
    </Box>
  );
};

export default Payment;
