import React from 'react';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { formatMoney, statusTone } from 'features/courier/courierData';
import { EarningsBreakdown } from 'features/courier/courierTypes';
import { PayrollRow } from '../../types';

type AdminCourierPayrollSectionProps = {
  earnings: EarningsBreakdown | null;
  month: string;
  onFetchEarnings: () => void | Promise<void>;
  onLockPayroll: () => void | Promise<void>;
  onMarkPayout: () => void | Promise<void>;
  onRunPayroll: () => void | Promise<void>;
  payrollRows: PayrollRow[];
  selectedCourierId: string;
  setMonth: React.Dispatch<React.SetStateAction<string>>;
};

const AdminCourierPayrollSection = ({
  earnings,
  month,
  onFetchEarnings,
  onLockPayroll,
  onMarkPayout,
  onRunPayroll,
  payrollRows,
  selectedCourierId,
  setMonth,
}: AdminCourierPayrollSectionProps) => (
  <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Earnings and Payroll
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Calculate monthly payouts with attendance, deliveries, petrol and
          penalties.
        </Typography>
      </div>
      <div className="flex flex-wrap gap-3">
        <TextField
          size="small"
          label="Month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
        <Button variant="outlined" onClick={onRunPayroll}>
          Run Payroll
        </Button>
        <Button
          variant="contained"
          onClick={onFetchEarnings}
          disabled={!selectedCourierId}
        >
          Fetch Earnings
        </Button>
        <Button
          variant="outlined"
          onClick={onLockPayroll}
          disabled={!selectedCourierId}
        >
          Lock Payroll
        </Button>
        <Button
          variant="outlined"
          color="success"
          onClick={onMarkPayout}
          disabled={!selectedCourierId}
        >
          Mark Paid
        </Button>
      </div>
    </div>
    {earnings ? (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ['Base Salary', formatMoney(earnings.baseSalary)],
          ['Present Days', `${earnings.presentDays}/${earnings.payableDays}`],
          ['Delivery Earnings', formatMoney(earnings.perDeliveryEarnings)],
          ['Petrol', formatMoney(earnings.petrolAllowanceApproved)],
          ['Incentive', formatMoney(earnings.incentiveAmount)],
          ['Penalties', `- ${formatMoney(earnings.penalties)}`],
          ['COD Pending', formatMoney(earnings.codPending)],
          ['Final Payout', formatMoney(earnings.totalPayable)],
        ].map(([label, value]) => (
          <Card
            key={String(label)}
            sx={{
              borderRadius: 4,
              boxShadow: 'none',
              border: '1px solid #e2e8f0',
            }}
          >
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <Typography color="text.secondary">
        Select a courier and fetch month-wise earnings to review payout.
      </Typography>
    )}

    <div className="space-y-3">
      {payrollRows.map((row) => (
        <div
          key={String(row.id || `${row.courierId}-${row.month}`)}
          className="rounded-3xl border border-slate-200 p-4 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="font-semibold text-slate-900">
              {row.courierName || `Courier ${row.courierId || '-'}`}
            </div>
            <div className="text-sm text-slate-500">
              {row.month} ? {row.presentDays || 0}/{row.payableDays || 0} days ?{' '}
              {formatMoney(row.totalPayable)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              size="small"
              label={row.payoutStatus || 'DRAFT'}
              color={statusTone(row.payoutStatus)}
            />
            {row.payoutReference && (
              <span className="text-xs text-slate-500">
                Ref {row.payoutReference}
              </span>
            )}
          </div>
        </div>
      ))}
      {!payrollRows.length && (
        <Typography color="text.secondary">
          Run payroll for the selected month to generate payout rows.
        </Typography>
      )}
    </div>
  </Paper>
);

export default AdminCourierPayrollSection;
