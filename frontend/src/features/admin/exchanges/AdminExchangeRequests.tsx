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
import { getErrorMessage } from 'shared/errors/apiError';

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
  receivedAt?: string | null;
  status?: string;
  exchangeStatus?: string;
  exchangeReason?: string;
  comment?: string;
  adminComment?: string;
  rejectionReason?: string;
  qcResult?: string;
  warehouseProofUrl?: string;
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
  replacementOrder?: {
    id?: number | string;
    replacementOrderNumber?: string;
    createdAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    proofUrl?: string;
    status?: string;
  } | null;
};
type DialogMode =
  | 'approve'
  | 'reject'
  | 'pickup'
  | 'receive'
  | 'replacement'
  | 'replacementDelivered';

const label = (value?: string | null) => (value || '-').replaceAll('_', ' ');
const date = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '-';

const localDateTime = (value?: string | null) => {
  const base = value
    ? new Date(value)
    : new Date(Date.now() + 3 * 60 * 60 * 1000);
  return new Date(base.getTime() - base.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','),
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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
  const [qcResult, setQcResult] = useState('QC_PASS');
  const [warehouseProofUrl, setWarehouseProofUrl] = useState('');
  const [replacementProofUrl, setReplacementProofUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
          getErrorMessage(
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
      setError(getErrorMessage(requestError, 'Failed to load exchange requests'));
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
    setQcResult(request.qcResult || 'QC_PASS');
    setWarehouseProofUrl(request.warehouseProofUrl || '');
    setReplacementProofUrl(request.replacementOrder?.proofUrl || '');
  };

  const actions = useMemo(
    () =>
      ({
        EXCHANGE_REQUESTED: ['approve', 'reject'],
        EXCHANGE_APPROVED: ['pickup'],
        EXCHANGE_IN_TRANSIT: ['receive'],
        EXCHANGE_RECEIVED: ['replacement'],
        EXCHANGE_SHIPPED: ['replacementDelivered'],
      }) as Record<string, DialogMode[]>,
    [],
  );
  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(requests.map((request) => (request.status || '').trim()).filter(Boolean)),
      ).sort(),
    [requests],
  );
  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesQuery =
        !query ||
        [
          request.oldProductTitle,
          request.newProductTitle,
          request.customerName,
          request.requestNumber,
          request.exchangeReason,
          request.comment,
          request.adminComment,
          String(request.oldOrderId ?? ''),
          String(request.id),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === 'ALL' || String(request.status || '') === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const exportExchanges = () => {
    const rows = [
      [
        'Request ID',
        'Request Number',
        'Old Order ID',
        'Old Product',
        'New Product',
        'Customer',
        'Status',
        'Reason',
        'Courier',
        'Pickup Scheduled',
        'QC Result',
        'Replacement Proof',
        'Replacement Delivered',
      ],
      ...filteredRequests.map((request) => [
        String(request.id),
        request.requestNumber || '',
        String(request.oldOrderId ?? ''),
        request.oldProductTitle || '',
        request.newProductTitle || '',
        request.customerName || '',
        request.status || '',
        request.exchangeReason || '',
        request.courierName || '',
        request.pickupScheduledAt || '',
        request.qcResult || '',
        request.replacementOrder?.proofUrl || '',
        request.replacementOrder?.deliveredAt || '',
      ]),
    ];

    downloadCsv('exchange-requests-export.csv', rows);
  };

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
      } else if (mode === 'pickup') {
        await api.patch(API_ROUTES.admin.exchanges.pickup(selected.id), {
          adminComment: adminComment.trim() || undefined,
        });
      } else if (mode === 'receive') {
        await api.patch(API_ROUTES.admin.exchanges.receive(selected.id), {
          adminComment: adminComment.trim() || undefined,
          qcResult: qcResult.trim() || undefined,
          warehouseProofUrl: warehouseProofUrl.trim() || undefined,
        });
      } else if (mode === 'reject') {
        await api.patch(API_ROUTES.admin.exchanges.reject(selected.id), {
          approved: false,
          adminComment: adminComment.trim() || undefined,
          rejectionReason: rejectionReason.trim() || undefined,
        });
      } else if (mode === 'replacement') {
        await api.patch(
          API_ROUTES.admin.exchanges.replacementOrder(selected.id),
          {
            adminComment: adminComment.trim() || undefined,
            replacementProofUrl: replacementProofUrl.trim() || undefined,
          },
        );
      } else {
        await api.patch(
          API_ROUTES.admin.exchanges.replacementDelivered(selected.id),
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
        getErrorMessage(requestError, 'Failed to update exchange request'),
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
        : mode === 'pickup'
        ? 'Mark Exchange Pickup'
        : mode === 'receive'
            ? 'Receive Exchange Item'
            : mode === 'replacementDelivered'
              ? 'Mark Replacement Delivered'
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outlined" onClick={loadPage} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={exportExchanges}
            disabled={filteredRequests.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <TextField
            size="small"
            placeholder="Search by product, customer, request, order or reason"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {label(status)}
              </MenuItem>
            ))}
          </TextField>
        </div>
        {filteredRequests.map((request) => {
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
                  <div className="mt-2">
                    <strong>QC:</strong> {label(request.qcResult)}
                  </div>
                  <div className="mt-2 break-all">
                    <strong>Proof:</strong> {request.warehouseProofUrl || 'Not attached'}
                  </div>
                </div>
              </div>

              {request.replacementOrder && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">
                    Replacement Timeline
                  </div>
                  <div className="mt-2">
                    Order: {request.replacementOrder.replacementOrderNumber || request.replacementOrder.id || 'Pending'}
                  </div>
                  <div className="mt-2">
                    Created: {date(request.replacementOrder.createdAt)}
                  </div>
                  <div className="mt-2">
                    Shipped: {date(request.replacementOrder.shippedAt)}
                  </div>
                  <div className="mt-2">
                    Delivered: {date(request.replacementOrder.deliveredAt)}
                  </div>
                  <div className="mt-2 break-all">
                    Proof: {request.replacementOrder.proofUrl || 'Not attached'}
                  </div>
                </div>
              )}

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
                {availableActions.includes('pickup') && (
                  <Button
                    variant="contained"
                    onClick={() => openDialog(request, 'pickup')}
                  >
                    Pickup Old Item
                  </Button>
                )}
                {availableActions.includes('receive') && (
                  <Button
                    variant="contained"
                    onClick={() => openDialog(request, 'receive')}
                  >
                    Receive + QC
                  </Button>
                )}
                {availableActions.includes('replacement') && (
                  <Button
                    variant="contained"
                    onClick={() => openDialog(request, 'replacement')}
                  >
                    Ship Replacement
                  </Button>
                )}
                {availableActions.includes('replacementDelivered') && (
                  <Button
                    variant="contained"
                    onClick={() => openDialog(request, 'replacementDelivered')}
                  >
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {!filteredRequests.length && !loading && (
          <Typography color="text.secondary">
            No exchange requests matched the current filters.
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
            {mode === 'receive' && (
              <>
                <TextField
                  select
                  fullWidth
                  label="QC result"
                  value={qcResult}
                  onChange={(event) => setQcResult(event.target.value)}
                >
                  <MenuItem value="QC_PASS">QC Pass</MenuItem>
                  <MenuItem value="QC_FAIL">QC Fail</MenuItem>
                  <MenuItem value="DAMAGED">Damaged</MenuItem>
                  <MenuItem value="REFURBISH">Refurbish</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  label="Warehouse proof URL"
                  value={warehouseProofUrl}
                  onChange={(event) => setWarehouseProofUrl(event.target.value)}
                />
              </>
            )}
            {mode === 'replacement' && (
              <TextField
                fullWidth
                label="Replacement shipment proof URL"
                value={replacementProofUrl}
                onChange={(event) => setReplacementProofUrl(event.target.value)}
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
