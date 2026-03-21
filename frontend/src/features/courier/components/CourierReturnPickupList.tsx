import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { api } from 'shared/api/Api';
import { uploadToCloudinary } from 'shared/utils/uploadToCloudinary';

type PickupItem = {
  id: number | string;
  orderId?: number | string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  productTitle?: string;
  productImage?: string;
  returnReason?: string;
  returnStatus?: string;
  status?: string;
  scheduledAt?: string;
  pickupPhoto?: string;
  note?: string;
};

const fmt = (value?: string) =>
  value ? new Date(value).toLocaleString() : '-';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  return fallback;
};

const CourierReturnPickupList = () => {
  const [items, setItems] = useState<PickupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PickupItem | null>(null);
  const [note, setNote] = useState('');
  const [pickupPhoto, setPickupPhoto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPickups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/courier/return-pickups');
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load return pickups'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPickups();
  }, []);

  const updateStatus = async (
    status: 'ARRIVED' | 'ITEM_PICKED' | 'PICKUP_COMPLETED',
  ) => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/api/courier/return-pickups/${selected.id}/status`, {
        status,
        note: note.trim() || undefined,
        pickupPhoto: pickupPhoto || undefined,
      });
      setSelected(null);
      setNote('');
      setPickupPhoto('');
      await loadPickups();
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update pickup'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    const url = await uploadToCloudinary(file);
    setPickupPhoto(url || '');
  };

  return (
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Return Pickups
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Arrive, pick the item, upload pickup proof, and complete the pickup.
          </Typography>
        </div>
        <Button variant="outlined" onClick={loadPickups} disabled={loading}>
          Refresh
        </Button>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      <div className="space-y-4">
        {items.map((task) => (
          <div
            key={String(task.id)}
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
                  Address: {task.pickupAddress}
                </div>
                <div className="text-sm text-slate-500">
                  Item: {task.productTitle || 'Order item'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Chip
                  size="small"
                  label={(task.returnStatus || 'PICKUP_SCHEDULED').replaceAll(
                    '_',
                    ' ',
                  )}
                  color="warning"
                />
                <Chip
                  size="small"
                  label={(task.status || 'PICKUP_SCHEDULED').replaceAll(
                    '_',
                    ' ',
                  )}
                  variant="outlined"
                />
                <Chip size="small" label={fmt(task.scheduledAt)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              {task.returnReason && (
                <span>Reason: {task.returnReason.replaceAll('_', ' ')}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="contained"
                onClick={() => {
                  setSelected(task);
                  setNote(task.note || '');
                  setPickupPhoto(task.pickupPhoto || '');
                }}
              >
                Update Pickup
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
        {!items.length && !loading && (
          <Typography color="text.secondary">
            No assigned return pickups right now.
          </Typography>
        )}
      </div>

      <Dialog
        open={!!selected}
        onClose={submitting ? undefined : () => setSelected(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Return Pickup</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
            <Button
              variant="outlined"
              component="label"
              sx={{ justifyContent: 'flex-start' }}
            >
              {pickupPhoto ? 'Replace pickup photo' : 'Upload pickup photo'}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
              />
            </Button>
            {pickupPhoto && (
              <a
                href={pickupPhoto}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 underline"
              >
                View pickup photo
              </a>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button onClick={() => setSelected(null)} disabled={submitting}>
            Close
          </Button>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => updateStatus('ARRIVED')}
              disabled={submitting}
            >
              Arrived
            </Button>
            <Button
              variant="outlined"
              onClick={() => updateStatus('ITEM_PICKED')}
              disabled={submitting}
            >
              Item Picked
            </Button>
            <Button
              variant="contained"
              onClick={() => updateStatus('PICKUP_COMPLETED')}
              disabled={submitting}
            >
              Pickup Completed
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CourierReturnPickupList;
