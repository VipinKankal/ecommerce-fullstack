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
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { mapCourier } from 'features/courier/courierData';
import { CourierProfile } from 'features/courier/courierTypes';
import ExchangePriceSummary from 'features/customer/pages/Account/components/ExchangePriceSummary';

type ExchangeHistoryItem = {
  status?: string;
  createdAt?: string;
  note?: string;
};

type RequestItem = {
  id: number | string;
  oldProductImage?: string;
  oldProductTitle?: string;
  newProductTitle?: string;
  oldOrderId?: number | string;
  requestNumber?: string;
  customerName?: string;
  courierName?: string;
  courierId?: number | string;
  pickupScheduledAt?: string | null;
  status?: string;
  exchangeStatus?: string;
  exchangeReason?: string;
  comment?: string;
  adminComment?: string;
  rejectionReason?: string;
  oldPrice?: number;
  newPrice?: number;
  priceDifference?: number;
  bankDetails?: { bankName?: string } | null;
  priceSummary?: { balanceMode?: string } | null;
  balanceHandling?: {
    walletCreditStatus?: string;
    bankRefundStatus?: string;
    bankDetails?: { bankName?: string } | null;
  } | null;
  history?: ExchangeHistoryItem[];
};
type DialogMode = 'approve' | 'reject' | 'replacement';

const label = (value?: string | null) => (value || '-').replaceAll('_', ' ');
const date = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '-';
const readErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;
const localDateTime = (value?: string | null) => {
  const base = value
    ? new Date(value)
    : new Date(Date.now() + 3 * 60 * 60 * 1000);
  return new Date(base.getTime() - base.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const AdminExchangeRequests = () => {
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
  const [courierId, setCourierId] = useState('');
  const [pickupScheduledAt, setPickupScheduledAt] = useState(localDateTime());

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestResponse, courierResponse] = await Promise.allSettled([
        api.get(API_ROUTES.admin.exchanges.base),
        api.get(API_ROUTES.adminCouriers.base),
      ]);

      if (requestResponse.status === 'fulfilled') {
        setRequests(
          Array.isArray(requestResponse.value.data)
            ? requestResponse.value.data
            : [],
        );
      } else {
        setRequests([]);
        setError(
          readErrorMessage(
            requestResponse.reason,
            'Failed to load exchange requests',
          ),
        );
      }

      if (courierResponse.status === 'fulfilled') {
        setCouriers(
          (Array.isArray(courierResponse.value.data)
            ? courierResponse.value.data
            : []
          ).map(mapCourier),
        );
      } else {
        setCouriers([]);
      }
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to load exchange requests'));
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
    setCourierId(request.courierId ? String(request.courierId) : '');
    setPickupScheduledAt(localDateTime(request.pickupScheduledAt));
  };

  const actions = useMemo(
    () =>
      ({
        EXCHANGE_REQUESTED: ['approve', 'reject'],
        EXCHANGE_PICKUP_COMPLETED: ['replacement'],
      }) as Record<string, DialogMode[]>,
    [],
  );

  const submit = async () => {
    if (!selected || !mode) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'approve') {
        await api.patch(API_ROUTES.admin.exchanges.approve(selected.id), {
          approved: true,
          adminComment: adminComment.trim() || undefined,
          courierId: courierId ? Number(courierId) : undefined,
          pickupScheduledAt: pickupScheduledAt
            ? new Date(pickupScheduledAt).toISOString()
            : undefined,
        });
      } else if (mode === 'reject') {
        await api.patch(API_ROUTES.admin.exchanges.reject(selected.id), {
          approved: false,
          adminComment: adminComment.trim() || undefined,
          rejectionReason: rejectionReason.trim() || undefined,
        });
      } else {
        await api.patch(
          API_ROUTES.admin.exchanges.replacementOrder(selected.id),
          {
            adminComment: adminComment.trim() || undefined,
          },
        );
      }
      setSuccess('Exchange request updated successfully.');
      setSelected(null);
      setMode(null);
      await loadPage();
    } catch (requestError: unknown) {
      setError(
        readErrorMessage(requestError, 'Failed to update exchange request'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle =
    mode === 'approve'
      ? 'Approve Exchange'
      : mode === 'reject'
        ? 'Reject Exchange'
        : 'Create Replacement Order';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Exchange Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Approve exchanges, review price difference, track wallet or bank
            balance handling, and create replacement orders after pickup.
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
        {requests.map((request) => {
          const availableActions =
            actions[(request.status || '').toUpperCase()] || [];
          return (
            <div
              key={String(request.id)}
              className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {request.oldProductImage ? (
                      <img
                        src={request.oldProductImage}
                        alt={request.oldProductTitle || 'Old Product'}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {request.oldProductTitle || 'Old Product'} ?{' '}
                      {request.newProductTitle || 'Replacement Product'}
                    </div>
                    <div className="text-sm text-slate-500">
                      Old Order #{request.oldOrderId} | Request #
                      {request.requestNumber || request.id}
                    </div>
                    <div className="text-sm text-slate-500">
                      Customer: {request.customerName || 'Customer'}
                    </div>
                    <div className="text-sm text-slate-500">
                      Courier: {request.courierName || 'Not assigned'}
                    </div>
                    <div className="text-sm text-slate-500">
                      Pickup: {date(request.pickupScheduledAt)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Chip label={label(request.status)} color="info" />
                  {request.balanceHandling?.walletCreditStatus && (
                    <Chip
                      label={`Wallet ${label(request.balanceHandling.walletCreditStatus)}`}
                      variant="outlined"
                    />
                  )}
                  {request.balanceHandling?.bankRefundStatus && (
                    <Chip
                      label={`Bank ${label(request.balanceHandling.bankRefundStatus)}`}
                      variant="outlined"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 min-h-[92px]">
                  <div>
                    <strong>Reason:</strong> {label(request.exchangeReason)}
                  </div>
                  <div className="mt-2">
                    {request.comment || 'No customer comment provided.'}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 min-h-[92px]">
                  <div>
                    <strong>Admin Comment:</strong>
                  </div>
                  <div className="mt-2">
                    {request.adminComment ||
                      request.rejectionReason ||
                      'No admin note yet.'}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 min-h-[92px]">
                  <div>
                    <strong>Balance Mode:</strong>{' '}
                    {label(request.priceSummary?.balanceMode)}
                  </div>
                  <div className="mt-2">
                    <strong>Bank Details:</strong>{' '}
                    {request.bankDetails?.bankName ||
                      request.balanceHandling?.bankDetails?.bankName ||
                      'Not provided'}
                  </div>
                </div>
              </div>

              <ExchangePriceSummary
                oldPrice={request.oldPrice}
                newPrice={request.newPrice}
                priceDifference={request.priceDifference}
                status={request.status}
              />

              {!!request.history?.length && (
                <Stack spacing={1.25}>
                  {request.history.map(
                    (entry: ExchangeHistoryItem, index: number) => (
                      <div
                        key={`${entry.status || 'status'}-${entry.createdAt || index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="font-medium text-slate-900">
                            {label(entry.status)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {date(entry.createdAt)}
                          </div>
                        </div>
                        {entry.note && (
                          <div className="mt-2 text-sm text-slate-600">
                            {entry.note}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </Stack>
              )}

              <div className="flex flex-wrap gap-3 justify-end">
                {availableActions.includes('approve') && (
                  <Button
                    variant="contained"
                    onClick={() => openDialog(request, 'approve')}
                  >
                    Approve
                  </Button>
                )}
                {availableActions.includes('reject') && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => openDialog(request, 'reject')}
                  >
                    Reject
                  </Button>
                )}
                {availableActions.includes('replacement') && (
                  <Button
                    variant="contained"
                    onClick={() => openDialog(request, 'replacement')}
                  >
                    Create Replacement Order
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {!requests.length && !loading && (
          <Typography color="text.secondary">
            No exchange requests found.
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
              onChange={(event) => setAdminComment(event.target.value)}
            />
            {mode === 'approve' && (
              <>
                <FormControl fullWidth>
                  <InputLabel id="exchange-courier-label">Courier</InputLabel>
                  <Select
                    labelId="exchange-courier-label"
                    value={courierId}
                    label="Courier"
                    onChange={(event) =>
                      setCourierId(String(event.target.value))
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
                  onChange={(event) => setPickupScheduledAt(event.target.value)}
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
                onChange={(event) => setRejectionReason(event.target.value)}
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
          <Button
            variant="contained"
            onClick={submit}
            disabled={
              submitting ||
              (mode === 'approve' && (!courierId || !pickupScheduledAt))
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminExchangeRequests;
