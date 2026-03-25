import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  adminSalesReport,
  adminSettlementLedger,
  adminSettlements,
} from 'State/backend/MasterApiThunks';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { api } from 'shared/api/Api';
import { getErrorMessage } from 'State/backend/masterApi/shared';

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

type SettlementRow = {
  id?: number | string;
  orderId?: number | string;
  orderType?: string;
  settlementStatus?: string;
  grossCollectedAmount?: number | string;
  commissionGstAmount?: number | string;
  tcsAmount?: number | string;
  sellerPayableAmount?: number | string;
  sellerGstLiabilityAmount?: number | string;
  adminGstLiabilityAmount?: number | string;
  createdAt?: string;
};

type LedgerRow = {
  id?: number | string;
  accountCode?: string;
  accountName?: string;
  entryDirection?: string;
  amount?: number | string;
};

type ComplianceChallan = {
  id?: number | string;
  taxStream?: string;
  filingPeriod?: string;
  amount?: number | string;
  challanReference?: string;
  paymentStatus?: string;
  paidAt?: string;
  notes?: string;
  createdAt?: string;
};

type LedgerAccountSummary = {
  accountCode: string;
  accountName: string;
  credits: number;
  debits: number;
  memos: number;
  entries: number;
};

const COMPLIANCE_CHALLANS_ROUTE = '/api/admin/compliance/challans';

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

const money = (value?: number | string | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const label = (value?: string | null) => (value || '-').replaceAll('_', ' ');
const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('en-IN') : '-';
const toMonthValue = () => new Date().toISOString().slice(0, 7);
const toDatetimeLocalValue = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const toSettlements = (payload: unknown): SettlementRow[] =>
  Array.isArray(payload) ? (payload as SettlementRow[]) : [];

const toLedgerRows = (payload: unknown): LedgerRow[] =>
  Array.isArray(payload) ? (payload as LedgerRow[]) : [];

const toChallans = (payload: unknown): ComplianceChallan[] =>
  Array.isArray(payload) ? (payload as ComplianceChallan[]) : [];

const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const AdminReports = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const [challans, setChallans] = useState<ComplianceChallan[]>([]);
  const [challanLoading, setChallanLoading] = useState(false);
  const [challanSubmitting, setChallanSubmitting] = useState(false);
  const [challanError, setChallanError] = useState<string | null>(null);
  const [challanSuccess, setChallanSuccess] = useState<string | null>(null);
  const [challanForm, setChallanForm] = useState({
    taxStream: 'GST',
    filingPeriod: toMonthValue(),
    amount: '',
    challanReference: '',
    paymentStatus: 'PAID',
    paidAt: toDatetimeLocalValue(),
    notes: '',
  });

  const report = toSalesReport(responses.adminSalesReport);
  const settlements = toSettlements(responses.adminSettlements);
  const ledgerRows = toLedgerRows(responses.adminSettlementLedger);
  const topCategories = report?.topCategories ?? [];
  const topSellers = report?.topSellers ?? [];

  const loadChallans = async () => {
    setChallanLoading(true);
    setChallanError(null);
    try {
      const response = await api.get(COMPLIANCE_CHALLANS_ROUTE);
      setChallans(toChallans(response.data));
    } catch (requestError: unknown) {
      setChallanError(
        getErrorMessage(requestError, 'Failed to load compliance challans'),
      );
    } finally {
      setChallanLoading(false);
    }
  };

  useEffect(() => {
    dispatch(adminSalesReport());
    dispatch(adminSettlements());
    dispatch(adminSettlementLedger());
    loadChallans();
  }, [dispatch]);

  const compliance = useMemo(() => {
    const totalCommissionGst = settlements.reduce(
      (sum, row) => sum + Number(row.commissionGstAmount || 0),
      0,
    );
    const totalTcs = settlements.reduce(
      (sum, row) => sum + Number(row.tcsAmount || 0),
      0,
    );
    const totalAdminGst = settlements.reduce(
      (sum, row) => sum + Number(row.adminGstLiabilityAmount || 0),
      0,
    );
    const totalSellerGstMemo = settlements.reduce(
      (sum, row) => sum + Number(row.sellerGstLiabilityAmount || 0),
      0,
    );
    const payoutReserve = settlements.reduce(
      (sum, row) => sum + Number(row.sellerPayableAmount || 0),
      0,
    );
    const grossCollections = settlements.reduce(
      (sum, row) => sum + Number(row.grossCollectedAmount || 0),
      0,
    );
    const readyForPayout = settlements.filter(
      (row) => row.settlementStatus === 'READY_FOR_PAYOUT',
    ).length;
    const retained = settlements.filter(
      (row) => row.settlementStatus === 'RETAINED',
    ).length;
    const challanPaid = challans.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    );

    return {
      totalCommissionGst,
      totalTcs,
      totalAdminGst,
      totalSellerGstMemo,
      payoutReserve,
      grossCollections,
      readyForPayout,
      retained,
      challanPaid,
    };
  }, [challans, settlements]);

  const ledgerAccounts = useMemo(() => {
    const summary = new Map<string, LedgerAccountSummary>();

    ledgerRows.forEach((row) => {
      const accountCode = String(row.accountCode || 'UNKNOWN');
      const current = summary.get(accountCode) || {
        accountCode,
        accountName: String(row.accountName || 'Unknown Account'),
        credits: 0,
        debits: 0,
        memos: 0,
        entries: 0,
      };
      const amount = Number(row.amount || 0);
      const direction = String(row.entryDirection || '').toUpperCase();

      current.entries += 1;
      if (direction === 'CREDIT') {
        current.credits += amount;
      } else if (direction === 'DEBIT') {
        current.debits += amount;
      } else {
        current.memos += amount;
      }

      summary.set(accountCode, current);
    });

    return Array.from(summary.values()).sort(
      (left, right) =>
        right.credits + right.debits - (left.credits + left.debits),
    );
  }, [ledgerRows]);

  const submitChallan = async () => {
    setChallanSubmitting(true);
    setChallanError(null);
    setChallanSuccess(null);
    try {
      await api.post(COMPLIANCE_CHALLANS_ROUTE, {
        taxStream: challanForm.taxStream,
        filingPeriod: challanForm.filingPeriod,
        amount: Number(challanForm.amount || 0),
        challanReference: challanForm.challanReference,
        paymentStatus: challanForm.paymentStatus,
        paidAt: challanForm.paidAt
          ? new Date(challanForm.paidAt).toISOString()
          : undefined,
        notes: challanForm.notes || undefined,
      });
      setChallanSuccess('Compliance challan saved successfully.');
      setChallanForm({
        taxStream: 'GST',
        filingPeriod: toMonthValue(),
        amount: '',
        challanReference: '',
        paymentStatus: 'PAID',
        paidAt: toDatetimeLocalValue(),
        notes: '',
      });
      await loadChallans();
    } catch (requestError: unknown) {
      setChallanError(
        getErrorMessage(requestError, 'Failed to save compliance challan'),
      );
    } finally {
      setChallanSubmitting(false);
    }
  };

  const exportSettlements = () => {
    const rows = [
      [
        'Order ID',
        'Type',
        'Status',
        'Gross',
        'Commission GST',
        'TCS',
        'Admin GST',
        'Seller GST Memo',
        'Created At',
      ],
      ...settlements.map((row) => [
        String(row.orderId || ''),
        row.orderType || '',
        row.settlementStatus || '',
        String(row.grossCollectedAmount || 0),
        String(row.commissionGstAmount || 0),
        String(row.tcsAmount || 0),
        String(row.adminGstLiabilityAmount || 0),
        String(row.sellerGstLiabilityAmount || 0),
        row.createdAt || '',
      ]),
    ];
    downloadCsv('gst-tcs-settlements.csv', rows);
  };

  const exportLedger = () => {
    const rows = [
      ['Account Code', 'Account Name', 'Direction', 'Amount'],
      ...ledgerRows.map((row) => [
        String(row.accountCode || ''),
        String(row.accountName || ''),
        String(row.entryDirection || ''),
        String(row.amount || 0),
      ]),
    ];
    downloadCsv('gst-tcs-ledger.csv', rows);
  };

  const exportChallans = () => {
    const rows = [
      [
        'Tax Stream',
        'Filing Period',
        'Amount',
        'Reference',
        'Status',
        'Paid At',
        'Notes',
      ],
      ...challans.map((row) => [
        String(row.taxStream || ''),
        String(row.filingPeriod || ''),
        String(row.amount || 0),
        String(row.challanReference || ''),
        String(row.paymentStatus || ''),
        String(row.paidAt || ''),
        String(row.notes || ''),
      ]),
    ];
    downloadCsv('gst-tcs-challans.csv', rows);
  };

  if (loading && !report && settlements.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Sales And Compliance Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platform sales summary plus GST/TCS month-close visibility from live
            settlement, ledger, and challan data.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            onClick={exportSettlements}
            disabled={settlements.length === 0}
          >
            Export Settlements
          </Button>
          <Button
            variant="outlined"
            onClick={exportLedger}
            disabled={ledgerRows.length === 0}
          >
            Export Ledger
          </Button>
          <Button
            variant="outlined"
            onClick={exportChallans}
            disabled={challans.length === 0}
          >
            Export Challans
          </Button>
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}
      {challanError && <Alert severity="error">{challanError}</Alert>}
      {challanSuccess && (
        <Alert severity="success" onClose={() => setChallanSuccess(null)}>
          {challanSuccess}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            title: 'Revenue',
            value: money(report?.totalRevenue),
            tone: 'Sales',
          },
          { title: 'Orders', value: report?.totalOrders || 0, tone: 'Sales' },
          {
            title: 'Delivered',
            value: report?.deliveredOrders || 0,
            tone: 'Sales',
          },
          {
            title: 'Cancelled',
            value: report?.cancelledOrders || 0,
            tone: 'Sales',
          },
          {
            title: 'Transactions',
            value: report?.totalTransactions || 0,
            tone: 'Sales',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              {card.tone}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          {
            title: 'Admin GST Payable',
            value: money(compliance.totalAdminGst),
            subtitle: 'Commission GST + retained GST + TCS stream',
          },
          {
            title: 'TCS Payable',
            value: money(compliance.totalTcs),
            subtitle: 'GSTR-8 dataset basis',
          },
          {
            title: 'Commission GST',
            value: money(compliance.totalCommissionGst),
            subtitle: 'Marketplace service tax',
          },
          {
            title: 'Seller GST Memo',
            value: money(compliance.totalSellerGstMemo),
            subtitle: 'Seller-side visibility only',
          },
          {
            title: 'Payout Reserve',
            value: money(compliance.payoutReserve),
            subtitle: `${compliance.readyForPayout} ready / ${compliance.retained} retained`,
          },
          {
            title: 'Challan Recorded',
            value: money(compliance.challanPaid),
            subtitle: `${challans.length} payment records saved`,
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Compliance
            </p>
            <p className="mt-3 text-sm font-semibold text-emerald-900">
              {card.title}
            </p>
            <p className="mt-1 text-3xl font-black tracking-tight text-emerald-950">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-emerald-800/80">{card.subtitle}</p>
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

      <Paper
        sx={{
          p: 3,
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              GST/TCS Filing Dataset
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order-level settlement rows that finance can use for GSTR-3B and
              GSTR-8 reconciliation.
            </Typography>
          </div>
          <Chip
            color="info"
            variant="outlined"
            label={`Gross collections ${money(compliance.grossCollections)}`}
          />
        </div>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '20px',
            border: '1px solid #eef2f7',
            boxShadow: 'none',
          }}
        >
          <Table sx={{ minWidth: 1100 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Gross</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Commission GST</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>TCS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Admin GST</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seller GST Memo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    No settlement data available.
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((row) => (
                  <TableRow key={row.id || row.orderId} hover>
                    <TableCell>#{row.orderId || 'N/A'}</TableCell>
                    <TableCell>{label(row.orderType)}</TableCell>
                    <TableCell>{money(row.grossCollectedAmount)}</TableCell>
                    <TableCell>{money(row.commissionGstAmount)}</TableCell>
                    <TableCell>{money(row.tcsAmount)}</TableCell>
                    <TableCell>{money(row.adminGstLiabilityAmount)}</TableCell>
                    <TableCell>{money(row.sellerGstLiabilityAmount)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={
                          row.settlementStatus === 'READY_FOR_PAYOUT'
                            ? 'success'
                            : 'info'
                        }
                        label={label(row.settlementStatus)}
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper
        sx={{
          p: 3,
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="mb-4">
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Ledger Accounts Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Account-wise totals from settlement ledger postings for month-close
            review.
          </Typography>
        </div>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '20px',
            border: '1px solid #eef2f7',
            boxShadow: 'none',
          }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Credits</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Debits</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Memos</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entries</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No ledger entries available.
                  </TableCell>
                </TableRow>
              ) : (
                ledgerAccounts.map((row) => (
                  <TableRow key={row.accountCode} hover>
                    <TableCell>{row.accountName}</TableCell>
                    <TableCell>{row.accountCode}</TableCell>
                    <TableCell>{money(row.credits)}</TableCell>
                    <TableCell>{money(row.debits)}</TableCell>
                    <TableCell>{money(row.memos)}</TableCell>
                    <TableCell>{row.entries}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper
        sx={{
          p: 3,
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="mb-4">
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Challan And Payment Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Save GST/TCS payment references and maintain a lightweight audit
            pack directly from the admin reports screen.
          </Typography>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <TextField
            select
            size="small"
            label="Tax Stream"
            value={challanForm.taxStream}
            onChange={(event) =>
              setChallanForm((current) => ({
                ...current,
                taxStream: event.target.value,
              }))
            }
          >
            <MenuItem value="GST">GST</MenuItem>
            <MenuItem value="TCS">TCS</MenuItem>
          </TextField>
          <TextField
            size="small"
            type="month"
            label="Filing Period"
            value={challanForm.filingPeriod}
            onChange={(event) =>
              setChallanForm((current) => ({
                ...current,
                filingPeriod: event.target.value,
              }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="number"
            label="Amount"
            value={challanForm.amount}
            onChange={(event) =>
              setChallanForm((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
          />
          <TextField
            size="small"
            label="Challan Reference"
            value={challanForm.challanReference}
            onChange={(event) =>
              setChallanForm((current) => ({
                ...current,
                challanReference: event.target.value,
              }))
            }
          />
          <TextField
            select
            size="small"
            label="Status"
            value={challanForm.paymentStatus}
            onChange={(event) =>
              setChallanForm((current) => ({
                ...current,
                paymentStatus: event.target.value,
              }))
            }
          >
            <MenuItem value="PAID">PAID</MenuItem>
            <MenuItem value="RECORDED">RECORDED</MenuItem>
          </TextField>
          <TextField
            size="small"
            type="datetime-local"
            label="Paid At"
            value={challanForm.paidAt}
            onChange={(event) =>
              setChallanForm((current) => ({
                ...current,
                paidAt: event.target.value,
              }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            label="Notes"
            value={challanForm.notes}
            onChange={(event) =>
              setChallanForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            sx={{ gridColumn: { xl: 'span 3' } }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="contained"
            onClick={submitChallan}
            disabled={challanSubmitting}
          >
            Save Challan
          </Button>
          <Button
            variant="outlined"
            onClick={loadChallans}
            disabled={challanLoading}
          >
            Refresh Challans
          </Button>
        </div>

        <TableContainer
          component={Paper}
          sx={{
            mt: 4,
            borderRadius: '20px',
            border: '1px solid #eef2f7',
            boxShadow: 'none',
          }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Tax Stream</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Paid At</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {challanLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : challans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No challan records saved yet.
                  </TableCell>
                </TableRow>
              ) : (
                challans.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{label(row.taxStream)}</TableCell>
                    <TableCell>{row.filingPeriod || '-'}</TableCell>
                    <TableCell>{money(row.amount)}</TableCell>
                    <TableCell>{row.challanReference || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={label(row.paymentStatus)}
                        color="success"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(row.paidAt)}</TableCell>
                    <TableCell>{row.notes || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default AdminReports;
