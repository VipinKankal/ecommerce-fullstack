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
  qcResult?: string;
  warehouseProofUrl?: string;
  refund?: { eligibleAfter?: string; status?: string } | null;
  history?: HistoryItem[];
};

type DialogMode =
  | 'approve'
  | 'reject'
  | 'pickup'
  | 'receive'
  | 'initiateRefund'
  | 'completeRefund';

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
  const [qcResult, setQcResult] = useState('QC_PASS');
  const [warehouseProofUrl, setWarehouseProofUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestResponse, courierResponse] = await Promise.allSettled([
        api.get(API_ROUTES.admin.returns.base),
        api.get(API_ROUTES.adminCouriers.base),
      ]);

      if (requestResponse.status === 'fulfilled') {
        setRequests(
          Array.isArray(requestResponse.value.data) ? requestResponse.value.data : [],
        );
      } else {
        setRequests([]);
        setError(
          getErrorMessage(
            requestResponse.reason,
            'Failed to load return requests',
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
    setQcResult(request.qcResult || 'QC_PASS');
    setWarehouseProofUrl(request.warehouseProofUrl || '');
  };

  const actions = useMemo(
    () =>
      ({
        RETURN_REQUESTED: ['approve', 'reject'],
        RETURN_APPROVED: ['pickup'],
        RETURN_IN_TRANSIT: ['receive'],
        REFUND_PENDING: ['initiateRefund'],
        REFUND_INITIATED: ['completeRefund'],
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
          request.productTitle,
          request.customerName,
          request.requestNumber,
          request.returnReason,
          request.comment,
          request.adminComment,
          String(request.orderId ?? ''),
          String(request.id),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === 'ALL' || String(request.status || '') === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);
  const dialogTitle =
    mode === 'approve'
      ? 'Approve Request'
      : mode === 'reject'
        ? 'Reject Request'
        : mode === 'pickup'
          ? 'Mark Return Pickup'
          : mode === 'receive'
            ? 'Receive Return'
        : mode === 'initiateRefund'
          ? 'Initiate Refund'
          : 'Complete Refund';

  const exportReturns = () => {
    const rows = [
      [
        'Request ID',
        'Request Number',
        'Order ID',
        'Product',
        'Customer',
        'Status',
        'Reason',
        'Courier',
        'Pickup Scheduled',
        'QC Result',
        'Refund Status',
        'Warehouse Proof',
      ],
      ...filteredRequests.map((request) => [
        String(request.id),
        request.requestNumber || '',
        String(request.orderId ?? ''),
        request.productTitle || '',
        request.customerName || '',
        request.status || '',
        request.returnReason || '',
        request.courierName || '',
        request.pickupScheduledAt || '',
        request.qcResult || '',
        request.refund?.status || '',
        request.warehouseProofUrl || '',
      ]),
    ];

    downloadCsv('return-requests-export.csv', rows);
  };

  const submit = async () => {
    if (!selected || !mode) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'approve' || mode === 'reject') {
        await api.patch(API_ROUTES.admin.returns.review(selected.id), {
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
      } else if (mode === 'pickup') {
        await api.patch(API_ROUTES.admin.returns.pickup(selected.id), {
          adminComment: adminComment.trim() || undefined,
        });
      } else if (mode === 'receive') {
        await api.patch(API_ROUTES.admin.returns.receive(selected.id), {
          adminComment: adminComment.trim() || undefined,
          qcResult: qcResult.trim() || undefined,
          warehouseProofUrl: warehouseProofUrl.trim() || undefined,
        });
      } else if (mode === 'initiateRefund') {
        await api.patch(API_ROUTES.admin.returns.refundInitiate(selected.id), {
          adminComment: adminComment.trim() || undefined,
        });
      } else if (mode === 'completeRefund') {
        await api.patch(API_ROUTES.admin.returns.refundComplete(selected.id), {
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outlined" onClick={loadPage} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={exportReturns}
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
                {prettify(status)}
              </MenuItem>
            ))}
          </TextField>
        </div>
        {filteredRequests.map((request) => (
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
                <div className="mt-2">
                  QC: {prettify(request.qcResult)}
                </div>
                <div className="mt-2 break-all">
                  Proof: {request.warehouseProofUrl || 'Not attached'}
                </div>
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
                'pickup',
              ) && (
                <Button
                  variant="contained"
                  onClick={() => openDialog(request, 'pickup')}
                >
                  Mark Pickup
                </Button>
              )}
              {(actions[(request.status || '').toUpperCase()] || []).includes(
                'receive',
              ) && (
                <Button
                  variant="contained"
                  onClick={() => openDialog(request, 'receive')}
                >
                  Receive + QC
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
        {!filteredRequests.length && !loading && (
          <Typography color="text.secondary">
            No return requests matched the current filters.
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
            {mode === 'receive' && (
              <>
                <TextField
                  select
                  fullWidth
                  label="QC result"
                  value={qcResult}
                  onChange={(e) => setQcResult(e.target.value)}
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
                  onChange={(e) => setWarehouseProofUrl(e.target.value)}
                />
              </>
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
