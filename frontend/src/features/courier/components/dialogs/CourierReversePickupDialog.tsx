import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { formatDateLabel } from 'features/courier/courierData';
import { reversePickupCompletedStatuses } from 'features/courier/courierDashboardConfig';
import { CourierAssignmentItem } from 'features/courier/courierTypes';

type ReversePickupFormState = {
  proofPhotoUrl: string;
  note: string;
};

type CourierReversePickupDialogProps = {
  open: boolean;
  selectedReverseTask: CourierAssignmentItem | null;
  reversePickupForm: ReversePickupFormState;
  setReversePickupForm: React.Dispatch<
    React.SetStateAction<ReversePickupFormState>
  >;
  uploadingReverseProof: boolean;
  submittingReversePickup: boolean;
  onClose: () => void;
  onAccept: () => void | Promise<void>;
  onStart: () => void | Promise<void>;
  onSubmit: () => void | Promise<void>;
  onProofUpload: (file?: File | null) => void | Promise<void>;
  isReversePickupAccepted: (task?: CourierAssignmentItem | null) => boolean;
  isReversePickupInProgress: (task?: CourierAssignmentItem | null) => boolean;
};

const CourierReversePickupDialog = ({
  open,
  selectedReverseTask,
  reversePickupForm,
  setReversePickupForm,
  uploadingReverseProof,
  submittingReversePickup,
  onClose,
  onAccept,
  onStart,
  onSubmit,
  onProofUpload,
  isReversePickupAccepted,
  isReversePickupInProgress,
}: CourierReversePickupDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>
      {selectedReverseTask?.reverseType === 'EXCHANGE'
        ? 'Exchange Pickup'
        : 'Return Pickup'}
    </DialogTitle>
    <DialogContent>
      {selectedReverseTask &&
        (() => {
          const picked =
            reversePickupCompletedStatuses.has(
              (selectedReverseTask.returnStatus || '').toUpperCase(),
            ) ||
            ['PICKED', 'COMPLETED'].includes(
              (selectedReverseTask.reversePickupTaskStatus || '').toUpperCase(),
            );
          const scheduledLabel = selectedReverseTask.reverseScheduledAt
            ? formatDateLabel(selectedReverseTask.reverseScheduledAt)
            : selectedReverseTask.deliveryWindow ||
              selectedReverseTask.etaLabel ||
              'Pickup slot pending';

          return (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Customer Details
                  </Typography>
                  <div className="mt-2 text-sm text-slate-600 space-y-1">
                    <div>{selectedReverseTask.customerName}</div>
                    <div>
                      {selectedReverseTask.customerPhone || 'Phone unavailable'}
                    </div>
                    <div>{selectedReverseTask.address}</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 p-4">
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Pickup Info
                  </Typography>
                  <div className="mt-2 text-sm text-slate-600 space-y-1">
                    <div>
                      Type: {selectedReverseTask.reverseType || 'RETURN'}
                    </div>
                    <div>
                      Status:{' '}
                      {selectedReverseTask.returnStatus ||
                        (selectedReverseTask.reverseType === 'EXCHANGE'
                          ? 'EXCHANGE_PICKUP_SCHEDULED'
                          : 'RETURN_PICKUP_SCHEDULED')}
                    </div>
                    <div>Pickup Slot: {scheduledLabel}</div>
                    <div>
                      Item: {selectedReverseTask.itemTitle || 'Order item'}
                    </div>
                  </div>
                </div>
              </div>

              {selectedReverseTask.returnReason && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
                  Return reason: {selectedReverseTask.returnReason}
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Pickup Proof
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload a photo of the collected item before completing
                      pickup.
                    </Typography>
                  </div>
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={uploadingReverseProof || picked}
                  >
                    {uploadingReverseProof
                      ? 'Uploading...'
                      : reversePickupForm.proofPhotoUrl
                        ? 'Replace Pickup Photo'
                        : 'Upload Pickup Photo'}
                    <input
                      hidden
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(event) =>
                        onProofUpload(event.target.files?.[0] || null)
                      }
                    />
                  </Button>
                </div>
                {reversePickupForm.proofPhotoUrl && (
                  <a
                    className="inline-block text-sm text-blue-600 underline"
                    href={reversePickupForm.proofPhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View uploaded pickup proof
                  </a>
                )}
                <TextField
                  size="small"
                  label="Pickup Note"
                  value={reversePickupForm.note}
                  onChange={(event) =>
                    setReversePickupForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  multiline
                  minRows={3}
                  fullWidth
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Flow: Accept pickup, collect the item from the customer, upload
                proof, then complete pickup so the request moves into transit for
                warehouse receive.
              </div>

              {picked && (
                <Alert severity="success">
                  Pickup already completed and the item is on the way back to
                  the warehouse.
                </Alert>
              )}
            </div>
          );
        })()}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
      {selectedReverseTask &&
        !isReversePickupAccepted(selectedReverseTask) &&
        !reversePickupCompletedStatuses.has(
          (selectedReverseTask.returnStatus || '').toUpperCase(),
        ) && (
          <Button
            variant="outlined"
            onClick={onAccept}
            disabled={submittingReversePickup}
          >
            {submittingReversePickup ? 'Updating...' : 'Accept Pickup'}
          </Button>
        )}
      {selectedReverseTask &&
        isReversePickupAccepted(selectedReverseTask) &&
        !isReversePickupInProgress(selectedReverseTask) &&
        !reversePickupCompletedStatuses.has(
          (selectedReverseTask.returnStatus || '').toUpperCase(),
        ) && (
          <Button
            variant="outlined"
            onClick={onStart}
            disabled={submittingReversePickup}
          >
            {submittingReversePickup ? 'Updating...' : 'Pickup Item'}
          </Button>
        )}
      {selectedReverseTask &&
        !reversePickupCompletedStatuses.has(
          (selectedReverseTask.returnStatus || '').toUpperCase(),
        ) && (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={submittingReversePickup || uploadingReverseProof}
          >
            {submittingReversePickup ? 'Updating...' : 'Complete Pickup'}
          </Button>
        )}
    </DialogActions>
  </Dialog>
);

export default CourierReversePickupDialog;
