import React from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { formatDateLabel, statusTone } from 'features/courier/courierData';
import { CourierProfile } from 'features/courier/courierTypes';
import { DeliveryHistoryItem } from '../types';

type AdminCourierTrackingDialogProps = {
  onClose: () => void;
  open: boolean;
  selectedOrderTracking: {
    orderId: number | string;
    history: DeliveryHistoryItem[];
  } | null;
};

export const AdminCourierTrackingDialog = ({
  onClose,
  open,
  selectedOrderTracking,
}: AdminCourierTrackingDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Delivery Tracking Timeline</DialogTitle>
    <DialogContent>
      <div className="space-y-3 pt-2">
        <div className="text-sm font-semibold text-slate-900">
          Order #{selectedOrderTracking?.orderId}
        </div>
        {selectedOrderTracking?.history?.length ? (
          selectedOrderTracking.history.map((entry) => (
            <div
              key={String(entry.id || `${entry.status}-${entry.updatedAt}`)}
              className="rounded-2xl border border-slate-200 p-4 bg-slate-50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-slate-900">
                  {(entry.status || 'UPDATE').replaceAll('_', ' ')}
                </div>
                <Chip
                  size="small"
                  label={(entry.status || 'UPDATE').replaceAll('_', ' ')}
                  color={statusTone(entry.status)}
                />
              </div>
              <div className="mt-2 text-sm text-slate-600 space-y-1">
                {entry.reason && <div>Reason: {entry.reason}</div>}
                {entry.note && <div>Note: {entry.note}</div>}
                <div>
                  Updated:{' '}
                  {entry.updatedAt ? formatDateLabel(entry.updatedAt) : '-'}
                </div>
                {entry.updatedBy && <div>By: {entry.updatedBy}</div>}
              </div>
            </div>
          ))
        ) : (
          <Typography color="text.secondary">
            No delivery history available yet.
          </Typography>
        )}
      </div>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

type AdminCourierProfileDialogProps = {
  onClose: () => void;
  open: boolean;
  selectedCourier: CourierProfile | null;
};

export const AdminCourierProfileDialog = ({
  onClose,
  open,
  selectedCourier,
}: AdminCourierProfileDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Courier Profile</DialogTitle>
    <DialogContent>
      {selectedCourier ? (
        <div className="space-y-3 text-sm text-slate-600 pt-2">
          <div>
            <strong>Name:</strong> {selectedCourier.fullName}
          </div>
          <div>
            <strong>Phone:</strong> {selectedCourier.phone}
          </div>
          <div>
            <strong>Email:</strong> {selectedCourier.email || '-'}
          </div>
          <div>
            <strong>City:</strong> {selectedCourier.city || '-'}
          </div>
          <div>
            <strong>Zone:</strong> {selectedCourier.zone || 'Unassigned'}
          </div>
          <div>
            <strong>Joining Date:</strong>{' '}
            {selectedCourier.joiningDate
              ? formatDateLabel(selectedCourier.joiningDate)
              : '-'}
          </div>
          <div>
            <strong>Status:</strong> {selectedCourier.status}
          </div>
          <div>
            <strong>KYC:</strong> {selectedCourier.kycStatus || 'PENDING'}
          </div>
          <div>
            <strong>Deliveries This Month:</strong>{' '}
            {selectedCourier.deliveriesThisMonth || 0}
          </div>
        </div>
      ) : null}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);
