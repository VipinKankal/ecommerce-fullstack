import {
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
  ChallanFormState,
  ComplianceChallan,
  ComplianceSummary,
  LedgerAccountSummary,
  LeaderboardItem,
  SettlementRow,
} from './AdminReports.types';
import { formatDateTime, label, money } from './AdminReports.utils';

type SummaryCardsProps = {
  reportCards: Array<{ title: string; value: string | number; tone: string }>;
  complianceCards: Array<{ title: string; value: string | number; subtitle: string }>;
};

export const AdminReportsSummaryCards = ({
  reportCards,
  complianceCards,
}: SummaryCardsProps) => (
  <>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {reportCards.map((card) => (
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
      {complianceCards.map((card) => (
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
  </>
);

export const AdminReportsLeaderboards = ({
  topCategories,
  topSellers,
}: {
  topCategories: LeaderboardItem[];
  topSellers: LeaderboardItem[];
}) => (
  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
    {[
      { title: 'Top Categories', rows: topCategories, empty: 'No category report data.' },
      { title: 'Top Sellers', rows: topSellers, empty: 'No seller report data.' },
    ].map((section) => (
      <Paper
        key={section.title}
        sx={{
          p: 3,
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          {section.title}
        </Typography>
        <div className="space-y-3">
          {section.rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {section.empty}
            </Typography>
          ) : (
            section.rows.map((item, index) => (
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
    ))}
  </div>
);

export const AdminSettlementTable = ({
  settlements,
  compliance,
}: {
  settlements: SettlementRow[];
  compliance: ComplianceSummary;
}) => (
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
);

export const AdminLedgerTable = ({
  ledgerAccounts,
}: {
  ledgerAccounts: LedgerAccountSummary[];
}) => (
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
);

type ChallanPanelProps = {
  challanForm: ChallanFormState;
  setChallanForm: React.Dispatch<React.SetStateAction<ChallanFormState>>;
  challans: ComplianceChallan[];
  challanLoading: boolean;
  challanSubmitting: boolean;
  onSubmit: () => void;
  onRefresh: () => void;
};

export const AdminChallanPanel = ({
  challanForm,
  setChallanForm,
  challans,
  challanLoading,
  challanSubmitting,
  onSubmit,
  onRefresh,
}: ChallanPanelProps) => (
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
      <Button variant="contained" onClick={onSubmit} disabled={challanSubmitting}>
        Save Challan
      </Button>
      <Button variant="outlined" onClick={onRefresh} disabled={challanLoading}>
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
);
