import React from 'react';
import { Button, Chip, Paper, Typography } from '@mui/material';
import {
  formatDateLabel,
  formatMoney,
  statusTone,
} from 'features/courier/courierData';
import { reversePickupCompletedStatuses } from 'features/courier/courierDashboardConfig';
import { CourierAssignmentItem } from 'features/courier/courierTypes';

type ReversePickupsSectionProps = {
  emptyState: string;
  onOpenTask: (task: CourierAssignmentItem) => void;
  tasks: CourierAssignmentItem[];
  title: string;
  isReversePickupAccepted: (task?: CourierAssignmentItem | null) => boolean;
};

const CourierReversePickupsSection = ({
  emptyState,
  onOpenTask,
  tasks,
  title,
  isReversePickupAccepted,
}: ReversePickupsSectionProps) => (
  <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Accept pickup tasks, collect the item, upload proof, and mark the
          reverse task picked.
        </Typography>
      </div>
      <Chip label={`${tasks.length} active`} color="warning" />
    </div>
    <div className="space-y-4">
      {tasks.map((task) => {
        const picked =
          reversePickupCompletedStatuses.has(
            (task.returnStatus || '').toUpperCase(),
          ) ||
          ['PICKED', 'COMPLETED'].includes(
            (task.reversePickupTaskStatus || '').toUpperCase(),
          );
        const accepted = isReversePickupAccepted(task);
        return (
          <div
            key={String(task.reverseTaskId ?? task.id)}
            className="rounded-3xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">
                  Order #{task.orderId}
                </div>
                <div className="text-sm text-slate-600">
                  Customer: {task.customerName}
                </div>
                <div className="text-sm text-slate-600">
                  Address: {task.address}
                </div>
                {task.itemTitle && (
                  <div className="text-sm text-slate-500">
                    Item: {task.itemTitle}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Chip
                  size="small"
                  label={
                    task.returnStatus ||
                    (task.reverseType === 'EXCHANGE'
                      ? 'EXCHANGE_PICKUP_SCHEDULED'
                      : 'RETURN_PICKUP_SCHEDULED')
                  }
                  color={statusTone(task.returnStatus)}
                />
                <Chip
                  size="small"
                  label={(
                    task.reversePickupTaskStatus ||
                    (accepted ? 'ACCEPTED' : 'SCHEDULED')
                  ).replace(/_/g, ' ')}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={
                    task.reverseScheduledAt
                      ? formatDateLabel(task.reverseScheduledAt)
                      : task.deliveryWindow ||
                        task.etaLabel ||
                        'Pickup slot pending'
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span>Request Type: {task.reverseType || 'RETURN'}</span>
              <span>Amount: {formatMoney(task.amount)}</span>
              {task.returnReason && <span>Reason: {task.returnReason}</span>}
              {task.reversePickedAt && (
                <span>Picked: {formatDateLabel(task.reversePickedAt)}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="contained" onClick={() => onOpenTask(task)}>
                {picked
                  ? 'View Pickup'
                  : !accepted
                    ? 'Accept Pickup'
                    : (task.reversePickupTaskStatus || '').toUpperCase() ===
                        'IN_PROGRESS'
                      ? 'Complete Pickup'
                      : 'Pickup Item'}
              </Button>
              <Button
                variant="outlined"
                href={`tel:${task.customerPhone || ''}`}
                disabled={!task.customerPhone}
              >
                Call Customer
              </Button>
              {task.proofPhotoUrl && (
                <Button
                  variant="text"
                  href={task.proofPhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Pickup Photo
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {!tasks.length && (
        <Typography color="text.secondary">{emptyState}</Typography>
      )}
    </div>
  </Paper>
);

export default CourierReversePickupsSection;
