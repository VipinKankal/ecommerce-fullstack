import React from 'react';
import { Alert, Chip, Stack, Typography } from '@mui/material';

type HistoryItem = {
  status?: string;
  note?: string;
  createdAt?: string;
  updatedBy?: string;
};

type RefundStatusPanelProps = {
  request: {
    requestNumber?: string;
    status?: string;
    returnReason?: string;
    requestedAt?: string;
    pickupScheduledAt?: string;
    pickupCompletedAt?: string;
    refundPendingAt?: string;
    refundInitiatedAt?: string;
    refundCompletedAt?: string;
    refund?: { eligibleAfter?: string; status?: string } | null;
    history?: HistoryItem[];
  };
};

const label = (value?: string | null) => (value || '-').replaceAll('_', ' ');
const date = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const RefundStatusPanel = ({ request }: RefundStatusPanelProps) => (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-4">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-700">
          Refund Timeline
        </div>
        <div className="text-sm font-semibold text-slate-900 mt-1">
          Return request � {label(request.status)}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Request No: {request.requestNumber || '-'}
        </div>
      </div>
      <Chip
        label={label(request.status)}
        color="success"
        sx={{ borderRadius: '999px', fontWeight: 700, alignSelf: 'flex-start' }}
      />
    </div>

    <Stack spacing={1.25}>
      <Typography variant="body2">
        <strong>Reason:</strong> {label(request.returnReason)}
      </Typography>
      <Typography variant="body2">
        <strong>Requested:</strong> {date(request.requestedAt)}
      </Typography>
      <Typography variant="body2">
        <strong>Pickup Scheduled:</strong> {date(request.pickupScheduledAt)}
      </Typography>
      <Typography variant="body2">
        <strong>Pickup Completed:</strong> {date(request.pickupCompletedAt)}
      </Typography>
      <Typography variant="body2">
        <strong>Refund Eligible After:</strong>{' '}
        {date(request.refund?.eligibleAfter)}
      </Typography>
      <Typography variant="body2">
        <strong>Refund Initiated:</strong> {date(request.refundInitiatedAt)}
      </Typography>
      <Typography variant="body2">
        <strong>Refund Completed:</strong> {date(request.refundCompletedAt)}
      </Typography>
    </Stack>

    {request.status === 'REFUND_PENDING' && request.refund?.eligibleAfter && (
      <Alert severity="info">
        Refund will become eligible after {date(request.refund.eligibleAfter)}.
      </Alert>
    )}

    {!!request.history?.length && (
      <div className="space-y-2">
        {request.history.map((entry, index) => (
          <div
            key={`${entry.status || 'status'}-${entry.createdAt || index}`}
            className="rounded-2xl border border-emerald-100 bg-white px-4 py-3"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="font-semibold text-slate-900 text-sm">
                {label(entry.status)}
              </div>
              <div className="text-xs text-slate-500">
                {date(entry.createdAt)}
              </div>
            </div>
            {entry.note && (
              <div className="mt-2 text-sm text-slate-600">{entry.note}</div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default RefundStatusPanel;
