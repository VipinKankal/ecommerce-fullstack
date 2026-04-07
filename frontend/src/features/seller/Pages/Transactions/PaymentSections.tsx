import React from 'react';
import {
  Card,
  Chip,
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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import {
  formatCurrency,
  formatDateTime,
  getLedgerTone,
  getSettlementTone,
  SellerLedgerRow,
  SellerSettlementRow,
} from './Payment.support';

export const PaymentSummaryCards = ({
  totalGross,
  totalNetPayable,
  totalDeductions,
  totalSellerGst,
}: {
  totalGross: number;
  totalNetPayable: number;
  totalDeductions: number;
  totalSellerGst: number;
}) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {[
      {
        title: 'Gross Collected',
        value: formatCurrency(totalGross),
        icon: <AccountBalanceWalletIcon />,
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      },
      {
        title: 'Net Payable',
        value: formatCurrency(totalNetPayable),
        icon: <PaymentsOutlinedIcon />,
        tone: 'bg-blue-50 text-blue-700 border-blue-100',
      },
      {
        title: 'Deductions',
        value: formatCurrency(totalDeductions),
        icon: <ReceiptLongOutlinedIcon />,
        tone: 'bg-violet-50 text-violet-700 border-violet-100',
      },
      {
        title: 'Seller GST Liability',
        value: formatCurrency(totalSellerGst),
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
        <p className="mt-1 text-3xl font-black tracking-tight">{card.value}</p>
      </div>
    ))}
  </div>
);

export const PaymentOverviewCard = ({
  latestDate,
  totalOrders,
  ledgerCount,
}: {
  latestDate: string | null;
  totalOrders: number;
  ledgerCount: number;
}) => (
  <Card sx={{ p: 3, borderRadius: 4, boxShadow: 'none', border: '1px solid #eef2f7' }}>
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
          label={latestDate ? `Latest settlement: ${formatDateTime(latestDate)}` : 'No settlement yet'}
        />
        <Chip color="default" variant="outlined" label={`${totalOrders} payout rows`} />
        <Chip color="success" variant="outlined" label={`${ledgerCount} ledger entries`} />
      </div>
    </div>

    <Divider sx={{ my: 3 }} />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[
        {
          title: 'Payout Formula',
          body: 'Net payout = gross collected - commission - commission GST - TCS.',
        },
        {
          title: 'Seller GST',
          body: 'Seller-facing GST liability stays visible separately so payout and GST do not get mixed together.',
        },
        {
          title: 'Ledger Proof',
          body: 'Every successful payment now posts settlement rows plus ledger entries for reconciliation.',
        },
      ].map((item) => (
        <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
          <Typography variant="overline" sx={{ fontWeight: 700 }}>
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.body}
          </Typography>
        </div>
      ))}
    </div>
  </Card>
);

export const PaymentFooterCards = () => (
  <Card sx={{ p: 3, borderRadius: 4, boxShadow: 'none', border: '1px solid #eef2f7' }}>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[
        {
          title: 'Settlement Readiness',
          body: 'Bank details, GST, and KYC should stay up to date for payout release.',
        },
        {
          title: 'TCS Visibility',
          body: 'Seller can now see how much TCS was withheld per payout row.',
        },
        {
          title: 'Historical Trail',
          body: 'Raw customer-linked transaction history remains available below.',
        },
      ].map((item) => (
        <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
          <Typography variant="overline" sx={{ fontWeight: 700 }}>
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.body}
          </Typography>
        </div>
      ))}
    </div>
  </Card>
);

export const PaymentSettlementTable = ({
  settlements,
  loading,
}: {
  settlements: SellerSettlementRow[];
  loading: boolean;
}) => (
  <Card sx={{ p: 3, borderRadius: 4, boxShadow: 'none', border: '1px solid #eef2f7' }}>
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Payout Breakdown
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Order-wise settlement rows with tax and deduction visibility.
        </Typography>
      </div>
      <Chip color="primary" variant="outlined" label="Gross - Commission - GST - TCS = Net" />
    </div>

    <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #eef2f7', boxShadow: 'none' }}>
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
                  <Chip size="small" variant="outlined" color={tone.color} label={tone.label} />
                </TableCell>
                <TableCell>{formatCurrency(row.grossCollectedAmount, row.currencyCode)}</TableCell>
                <TableCell>{formatCurrency(row.commissionAmount, row.currencyCode)}</TableCell>
                <TableCell>{formatCurrency(row.commissionGstAmount, row.currencyCode)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{formatCurrency(row.tcsAmount, row.currencyCode)}</span>
                    <Typography variant="caption" color="text.secondary">
                      {Number(row.tcsRatePercentage || 0)}%
                    </Typography>
                  </div>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(row.sellerPayableAmount, row.currencyCode)}</TableCell>
                <TableCell>{formatCurrency(row.sellerGstLiabilityAmount, row.currencyCode)}</TableCell>
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
                {loading ? 'Loading payout rows...' : 'No settlements found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Card>
);

export const PaymentLedgerTable = ({
  ledgerEntries,
  loading,
}: {
  ledgerEntries: SellerLedgerRow[];
  loading: boolean;
}) => (
  <Card sx={{ p: 3, borderRadius: 4, boxShadow: 'none', border: '1px solid #eef2f7' }}>
    <div className="mb-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Settlement Ledger
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Posting trail for settlement accounts so payout math stays explainable.
      </Typography>
    </div>

    <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #eef2f7', boxShadow: 'none' }}>
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {row.entryGroup || 'MEMO'}
                    </Typography>
                    <Chip size="small" variant="outlined" color={tone.color} label={tone.label} sx={{ width: 'fit-content' }} />
                  </div>
                </TableCell>
                <TableCell>{row.accountName || 'N/A'}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(row.amount, row.currencyCode)}</TableCell>
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
);
