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
import { API_ROUTES } from 'shared/api/ApiRoutes';

const label = (value?: string | null) => (value || '-').replaceAll('_', ' ');
const date = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '-';

type ExchangePickupItem = {
  id: number | string;
  oldOrderId?: number | string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  oldProductTitle?: string;
  newProductTitle?: string;
  exchangeStatus?: string;
  status?: string;
  scheduledAt?: string | null;
  exchangeReason?: string;
  arrivedAt?: string | null;
  oldItemPickedAt?: string | null;
  completedAt?: string | null;
  note?: string;
  pickupPhoto?: string;
};
type PickupAction = 'ARRIVED' | 'OLD_ITEM_PICKED' | 'PICKUP_COMPLETED';

const readErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const CourierExchangePickupList = () => {
  const [pickups, setPickups] = useState<ExchangePickupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<ExchangePickupItem | null>(null);
  const [note, setNote] = useState('');
  const [pickupPhoto, setPickupPhoto] = useState('');
  const [action, setAction] = useState<PickupAction>('ARRIVED');

  const loadPickups = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ROUTES.courier.exchangePickups);
      setPickups(Array.isArray(response.data) ? response.data : []);
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(requestError, 'Failed to load exchange pickups'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPickups();
  }, []);

  const openDialog = (pickup: ExchangePickupItem, nextAction: PickupAction) => {
    setSelected(pickup);
    setAction(nextAction);
    setNote(pickup.note || '');
    setPickupPhoto(pickup.pickupPhoto || '');
  };

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(API_ROUTES.courier.exchangePickupStatus(selected.id), {
        status: action,
        note: note.trim() || undefined,
        pickupPhoto: pickupPhoto.trim() || undefined,
      });
      setSuccess('Exchange pickup updated successfully.');
      setSelected(null);
      await loadPickups();
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(requestError, 'Failed to update exchange pickup'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const nextActionFor = (pickup: ExchangePickupItem): PickupAction | null => {
    const status = String(pickup.status || '').toUpperCase();
    if (status === 'SCHEDULED') return 'ARRIVED';
    if (status === 'ARRIVED') return 'OLD_ITEM_PICKED';
    if (status === 'OLD_ITEM_PICKED') return 'PICKUP_COMPLETED';
    return null;
  };

  return (
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Exchange Pickups
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Arrive at the customer address, pick the old item, upload pickup
            proof, and complete the exchange pickup.
          </Typography>
        </div>
        <Button variant="outlined" onClick={loadPickups} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <div className="space-y-4">
        {pickups.map((pickup) => {
          const nextAction = nextActionFor(pickup);
          return (
            <div
              key={String(pickup.id)}
              className="rounded-3xl border border-sky-200 bg-sky-50 p-4 flex flex-col gap-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900">
                    Old Order #{pickup.oldOrderId}
                  </div>
                  <div className="text-sm text-slate-600">
                    Customer: {pickup.customerName || 'Customer'}
                  </div>
                  <div className="text-sm text-slate-600">
                    Phone: {pickup.customerPhone || 'Phone unavailable'}
                  </div>
                  <div className="text-sm text-slate-600">
                    Address: {pickup.pickupAddress || 'Address unavailable'}
                  </div>
                  <div className="text-sm text-slate-500">
                    Old Item: {pickup.oldProductTitle || 'Product'}
                  </div>
                  <div className="text-sm text-slate-500">
                    Replacement:{' '}
                    {pickup.newProductTitle || 'Replacement Product'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Chip
                    size="small"
                    label={label(pickup.exchangeStatus)}
                    color="info"
                  />
                  <Chip
                    size="small"
                    label={label(pickup.status)}
                    variant="outlined"
                  />
                  <Chip size="small" label={date(pickup.scheduledAt)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span>Reason: {label(pickup.exchangeReason)}</span>
                {pickup.arrivedAt && (
                  <span>Arrived: {date(pickup.arrivedAt)}</span>
                )}
                {pickup.oldItemPickedAt && (
                  <span>Old Item Picked: {date(pickup.oldItemPickedAt)}</span>
                )}
                {pickup.completedAt && (
                  <span>Pickup Completed: {date(pickup.completedAt)}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {nextAction && (
                  <Button
                    variant="contained"
                    onClick={() => openDialog(pickup, nextAction)}
                  >
                    {label(nextAction)}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  href={`tel:${pickup.customerPhone || ''}`}
                  disabled={!pickup.customerPhone}
                >
                  Call Customer
                </Button>
                {pickup.pickupPhoto && (
                  <Button
                    variant="text"
                    href={pickup.pickupPhoto}
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
        {!pickups.length && !loading && (
          <Typography color="text.secondary">
            No assigned exchange pickups right now.
          </Typography>
        )}
      </div>

      <Dialog
        open={!!selected}
        onClose={submitting ? undefined : () => setSelected(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{label(action)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <TextField
              fullWidth
              label="Pickup photo URL"
              value={pickupPhoto}
              onChange={(event) => setPickupPhoto(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSelected(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submit} disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CourierExchangePickupList;
