import React from 'react';
import { Card, CardContent, Paper, TextField, Typography } from '@mui/material';
import { formatMoney } from 'features/courier/courierData';
import { EarningsBreakdown } from 'features/courier/courierTypes';

type EarningsSectionProps = {
  earnings: EarningsBreakdown | null;
  month: string;
  setMonth: React.Dispatch<React.SetStateAction<string>>;
};

const CourierEarningsSection = ({
  earnings,
  month,
  setMonth,
}: EarningsSectionProps) => (
  <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Monthly Earnings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Base salary + deliveries + petrol + incentives - penalties
        </Typography>
      </div>
      <TextField
        size="small"
        label="Month"
        value={month}
        onChange={(event) => setMonth(event.target.value)}
      />
    </div>
    {earnings ? (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ['Base Salary', formatMoney(earnings.baseSalary)],
          ['Per Delivery Earnings', formatMoney(earnings.perDeliveryEarnings)],
          ['Petrol Allowance', formatMoney(earnings.petrolAllowanceApproved)],
          [
            'Deliveries',
            `${earnings.deliveriesCount} x ${formatMoney(earnings.perDeliveryRate)}`,
          ],
          ['Incentive', formatMoney(earnings.incentiveAmount)],
          ['Penalties', `- ${formatMoney(earnings.penalties)}`],
          ['COD Pending', formatMoney(earnings.codPending)],
          ['Total Payable', formatMoney(earnings.totalPayable)],
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
        No earnings snapshot available.
      </Typography>
    )}
  </Paper>
);

export default CourierEarningsSection;
