import React from 'react';
import { Card, CardContent, Paper, Typography } from '@mui/material';
import { CourierProfile } from 'features/courier/courierTypes';

type OverviewStats = {
  ordersToday: number;
  deliveredToday: number;
  failedToday: number;
  activeCouriers: number;
  dispatchPending: number;
  codPendingVerification: number;
  monthlyPayoutPending: number;
};

type AdminCourierOverviewSectionProps = {
  overview: OverviewStats;
  selectedCourier: CourierProfile | null;
};

const AdminCourierOverviewSection = ({
  overview,
  selectedCourier,
}: AdminCourierOverviewSectionProps) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        ['Orders Today', overview.ordersToday],
        ['Delivered Today', overview.deliveredToday],
        ['Failed Delivery', overview.failedToday],
        ['Active Couriers', overview.activeCouriers],
        ['Dispatch Pending', overview.dispatchPending],
        ['COD Pending Verification', overview.codPendingVerification],
        ['Monthly Payout Pending', overview.monthlyPayoutPending],
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
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none">
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Courier Control Center
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            Courier registry, KYC and salary controls
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            Dispatch batch assignment with zone and COD awareness
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            COD reconciliation and petrol claim approvals
          </div>
        </div>
      </Paper>

      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none">
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Selected Courier Snapshot
        </Typography>
        {selectedCourier ? (
          <div className="space-y-2 text-sm text-slate-600">
            <div className="font-semibold text-slate-900">
              {selectedCourier.fullName}
            </div>
            <div>Phone: {selectedCourier.phone}</div>
            <div>City: {selectedCourier.city || '-'}</div>
            <div>Zone: {selectedCourier.zone || 'Unassigned'}</div>
            <div>KYC: {selectedCourier.kycStatus || 'PENDING'}</div>
            <div>Status: {selectedCourier.status}</div>
          </div>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a courier to see profile and payroll actions.
          </Typography>
        )}
      </Paper>
    </div>
  </div>
);

export default AdminCourierOverviewSection;
