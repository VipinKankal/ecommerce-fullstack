import React from 'react';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import {
  formatMoney,
  getPaymentBadgeLabel,
  statusTone,
} from 'features/courier/courierData';
import { CourierAssignmentItem } from 'features/courier/courierTypes';

type DeliveriesSectionProps = {
  activeAssignments: CourierAssignmentItem[];
  loading: boolean;
  onOpenTask: (task: CourierAssignmentItem) => void;
  onRefresh: () => void | Promise<void>;
  overview: {
    ordersToday: number;
    deliveredToday: number;
    failedToday: number;
    codCollected: number;
  };
};

const CourierDeliveriesSection = ({
  activeAssignments,
  loading,
  onOpenTask,
  onRefresh,
  overview,
}: DeliveriesSectionProps) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        ['Assigned Today', overview.ordersToday],
        ['Delivered Today', overview.deliveredToday],
        ['Failed Today', overview.failedToday],
        ['COD Collected', formatMoney(overview.codCollected)],
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
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>

    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Today&apos;s Deliveries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Follow the strict Payment to OTP to Delivery sequence for COD
            orders.
          </Typography>
        </div>
        <Button variant="outlined" onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {activeAssignments.map((task) => (
          <div
            key={String(task.id)}
            className="rounded-3xl border border-slate-200 p-4 bg-white flex flex-col gap-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">
                  Order #{task.orderId}
                </div>
                <div className="text-sm text-slate-500">
                  Customer: {task.customerName}
                </div>
                <div className="text-sm text-slate-500">
                  Address: {task.address}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Chip
                  size="small"
                  label={getPaymentBadgeLabel(task)}
                  color={statusTone(task.paymentStatus)}
                />
                <Chip
                  size="small"
                  label={task.courierTaskStatus}
                  color={statusTone(task.courierTaskStatus)}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={
                    task.deliveryWindow || task.etaLabel || 'Today 2PM - 6PM'
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span>Shipment: {task.shipmentStatus}</span>
              <span>Amount: {formatMoney(task.amount)}</span>
              <span>OTP: {task.requiresOtp ? 'Required' : 'Not Required'}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="contained" onClick={() => onOpenTask(task)}>
                View Details
              </Button>
              <Button
                variant="outlined"
                href={`tel:${task.customerPhone || ''}`}
                disabled={!task.customerPhone}
              >
                Call Customer
              </Button>
            </div>
          </div>
        ))}
        {!activeAssignments.length && (
          <Typography color="text.secondary">
            No active delivery tasks right now.
          </Typography>
        )}
      </div>
    </Paper>
  </div>
);

export default CourierDeliveriesSection;
