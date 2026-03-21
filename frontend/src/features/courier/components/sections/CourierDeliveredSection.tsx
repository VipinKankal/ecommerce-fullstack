import React from 'react';
import { Button, Chip, Paper, Typography } from '@mui/material';
import { formatMoney, statusTone } from 'features/courier/courierData';
import { CourierAssignmentItem } from 'features/courier/courierTypes';

type DeliveredSectionProps = {
  deliveredAssignments: CourierAssignmentItem[];
  onOpenTask: (task: CourierAssignmentItem) => void;
};

const CourierDeliveredSection = ({
  deliveredAssignments,
  onOpenTask,
}: DeliveredSectionProps) => (
  <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Delivered Orders
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completed orders move here after OTP verification and final delivery
          confirmation.
        </Typography>
      </div>
      <Chip
        label={`${deliveredAssignments.length} delivered`}
        color="success"
      />
    </div>
    <div className="space-y-4">
      {deliveredAssignments.map((task) => (
        <div
          key={String(task.id)}
          className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col gap-3"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-900">
                Order #{task.orderId}
              </div>
              <div className="text-sm text-slate-600">
                {task.customerName} - {task.address}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                size="small"
                label={
                  task.paymentType === 'COD'
                    ? `COD ${formatMoney(task.codAmount || task.amount)}`
                    : 'Paid Online'
                }
                color={statusTone(task.paymentStatus)}
              />
              <Chip
                size="small"
                label="DELIVERED"
                color="success"
                variant="outlined"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span>OTP: {task.otpVerified ? 'Verified' : 'Pending'}</span>
            <span>Shipment: {task.shipmentStatus}</span>
            <span>Amount: {formatMoney(task.amount)}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outlined" onClick={() => onOpenTask(task)}>
              View Delivery Detail
            </Button>
          </div>
        </div>
      ))}
      {!deliveredAssignments.length && (
        <Typography color="text.secondary">No delivered orders yet.</Typography>
      )}
    </div>
  </Paper>
);

export default CourierDeliveredSection;
