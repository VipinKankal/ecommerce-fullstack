import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { api } from 'shared/api/Api';
import { mapCourier } from 'features/courier/courierData';
import { CourierProfile } from 'features/courier/courierTypes';

type HistoryItem = { status?: string; note?: string; createdAt?: string };
type RequestItem = {
  id: number | string;
  requestNumber?: string;
  orderId?: number | string;
  customerName?: string;
  returnReason?: string;
  comment?: string;
  adminComment?: string;
  rejectionReason?: string;
  status?: string;
  productTitle?: string;
  productImage?: string;
  pickupScheduledAt?: string;
  courierName?: string;
  courierId?: number | string;
  refund?: { eligibleAfter?: string; status?: string } | null;
  history?: HistoryItem[];
};

type DialogMode = 'approve' | 'reject' | 'initiateRefund' | 'completeRefund';

const prettify = (value?: string | null) => (value || '-').replaceAll('_', ' ');
const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '-';
const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) {
    const next = new Date(Date.now() + 4 * 60 * 60 * 1000);
    return new Date(next.getTime() - next.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ''
    : new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
};

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

const AdminReturnRequests = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [couriers, setCouriers] = useState<CourierProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [mode, setMode] = useState<DialogMode | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [pickupScheduledAt, setPickupScheduledAt] = useState(
    toDatetimeLocalValue(),
  );

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestResponse, courierResponse] = await Promise.all([
        api.get('/api/admin/returns'),
        api.get('/api/admin/couriers'),
      ]);
      setRequests(
        Array.isArray(requestResponse.data) ? requestResponse.data : [],
      );
      setCouriers(
        (Array.isArray(courierResponse.data) ? courierResponse.data : []).map(
          mapCourier,
        ),
      );
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load return requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const openDialog = (request: RequestItem, nextMode: DialogMode) => {
    setSelected(request);
    setMode(nextMode);
    setAdminComment(request.adminComment || '');
    setRejectionReason(request.rejectionReason || '');
    setSelectedCourierId(request.courierId ? String(request.courierId) : '');
    setPickupScheduledAt(toDatetimeLocalValue(request.pickupScheduledAt));
  };

  const actions = useMemo(
    () =>
      ({
        RETURN_REQUESTED: ['approve', 'reject'],
        REFUND_PENDING: ['initiateRefund'],
        REFUND_INITIATED: ['completeRefund'],
      }) as Record<string, DialogMode[]>,
    [],
  );
  const dialogTitle =
    mode === 'approve'
      ? 'Approve Request'
      : mode === 'reject'
        ? 'Reject Request'
        : mode === 'initiateRefund'
          ? 'Initiate Refund'
          : 'Complete Refund';

  const submit = async () => {
    if (!selected || !mode) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'approve' || mode === 'reject') {
        await api.patch(`/api/admin/returns/${selected.id}/review`, {
          approved: mode === 'approve',
          adminComment: adminComment.trim() || undefined,
          rejectionReason:
            mode === 'reject' ? rejectionReason.trim() || undefined : undefined,
          courierId: mode === 'approve' ? Number(selectedCourierId) : undefined,
          pickupScheduledAt:
            mode === 'approve' && pickupScheduledAt
              ? new Date(pickupScheduledAt).toISOString()
              : undefined,
        });
      } else if (mode === 'initiateRefund') {
        await api.patch(`/api/admin/returns/${selected.id}/refund/initiate`, {
          adminComment: adminComment.trim() || undefined,
        });
      } else if (mode === 'completeRefund') {
        await api.patch(`/api/admin/returns/${selected.id}/refund/complete`, {
          adminComment: adminComment.trim() || undefined,
        });
      }
      setSuccess('Request updated successfully.');
      setSelected(null);
      setMode(null);
      await loadPage();
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update return request'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Return Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review return requests, assign courier pickups, and manage refund
            initiation and completion.
          </Typography>
        </div>
        <Button variant="outlined" onClick={loadPage} disabled={loading}>
          Refresh
        </Button>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        {requests.map((request) => (
          <div
            key={String(request.id)}
            className="rounded-3xl border border-slate-200 bg-white p-4 flex flex-col gap-4"
          >
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  {request.productImage ? (
                    <img
                      src={request.productImage}
                      alt={request.productTitle || 'Product'}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {request.productTitle || 'Order item'}
                  </div>
                  <div className="text-sm text-slate-500">
                    Order #{request.orderId} | Request #
                    {request.requestNumber || request.id}
                  </div>
                  <div className="text-sm text-slate-500">
                    Customer: {request.customerName || 'Customer'}
                  </div>
                  <div className="text-sm text-slate-500">
                    Reason: {prettify(request.returnReason)}
                  </div>
                  <div className="text-sm text-slate-500">
                    Pickup: {formatDateTime(request.pickupScheduledAt)}
                  </div>
                  {request.refund?.eligibleAfter && (
                    <div className="text-sm text-slate-500">
                      Refund Eligible:{' '}
                      {formatDateTime(request.refund.eligibleAfter)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Chip label={prettify(request.status)} color="warning" />
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 min-h-[84px]">
                {request.comment || 'No customer comment provided.'}
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 min-h-[84px]">
                {request.adminComment ||
                  request.rejectionReason ||
                  'No admin note yet.'}
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 min-h-[84px]">
                Courier: {request.courierName || 'Not assigned'}
              </div>
            </div>
            {!!request.history?.length && (
              <Stack spacing={1.25}>
                {request.history.map((entry, index) => (
                  <div
                    key={`${entry.status || 'status'}-${entry.createdAt || index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="font-medium text-slate-900">
                        {prettify(entry.status)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDateTime(entry.createdAt)}
                      </div>
                    </div>
                    {entry.note && (
                      <div className="mt-2 text-sm text-slate-600">
                        {entry.note}
                      </div>
                    )}
                  </div>
                ))}
              </Stack>
            )}
            <div className="flex flex-wrap gap-3 justify-end">
              {(actions[(request.status || '').toUpperCase()] || []).includes(
                'approve',
              ) && (
                <Button
                  variant="contained"
                  onClick={() => openDialog(request, 'approve')}
                >
                  Approve
                </Button>
              )}
              {(actions[(request.status || '').toUpperCase()] || []).includes(
                'reject',
              ) && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => openDialog(request, 'reject')}
                >
                  Reject
                </Button>
              )}
              {(actions[(request.status || '').toUpperCase()] || []).includes(
                'initiateRefund',
              ) && (
                <Button
                  variant="contained"
                  onClick={() => openDialog(request, 'initiateRefund')}
                >
                  Initiate Refund
                </Button>
              )}
              {(actions[(request.status || '').toUpperCase()] || []).includes(
                'completeRefund',
              ) && (
                <Button
                  variant="contained"
                  onClick={() => openDialog(request, 'completeRefund')}
                >
                  Complete Refund
                </Button>
              )}
            </div>
          </div>
        ))}
        {!requests.length && !loading && (
          <Typography color="text.secondary">
            No return requests found.
          </Typography>
        )}
      </Paper>
      <Dialog
        open={!!selected && !!mode}
        onClose={
          submitting
            ? undefined
            : () => {
                setSelected(null);
                setMode(null);
              }
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Admin comment"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
            />
            {mode === 'approve' && (
              <>
                <FormControl fullWidth>
                  <InputLabel id="return-refund-courier-label">
                    Courier
                  </InputLabel>
                  <Select
                    labelId="return-refund-courier-label"
                    value={selectedCourierId}
                    label="Courier"
                    onChange={(e) =>
                      setSelectedCourierId(String(e.target.value))
                    }
                  >
                    {couriers
                      .filter((courier) => courier.status === 'ACTIVE')
                      .map((courier) => (
                        <MenuItem
                          key={String(courier.id)}
                          value={String(courier.id)}
                        >
                          {courier.fullName} | {courier.phone}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Pickup schedule"
                  value={pickupScheduledAt}
                  onChange={(e) => setPickupScheduledAt(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </>
            )}
            {mode === 'reject' && (
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Rejection reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setSelected(null);
              setMode(null);
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={submit} disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminReturnRequests;
