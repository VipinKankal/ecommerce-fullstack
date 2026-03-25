import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { SearchRounded } from '@mui/icons-material';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

type TaxAdjustmentDelta = {
  grossAmount?: number;
  gstAmount?: number;
  sellerPayableAmount?: number;
};

type ExchangeTaxAdjustmentSummary = {
  noteType?: string;
  postingStatus?: string;
  summary?: string;
  netDelta?: TaxAdjustmentDelta | null;
};

type SellerExchangeRequest = {
  id: number;
  requestNumber?: string;
  oldOrderId?: number;
  customerName?: string;
  status?: string;
  oldProductTitle?: string;
  newProductTitle?: string;
  exchangeReason?: string;
  requestedAt?: string;
  priceSummary?: {
    oldPrice?: number;
    newPrice?: number;
    priceDifference?: number;
  };
  taxAdjustment?: ExchangeTaxAdjustmentSummary | null;
};

const label = (value?: string | null) => (value || '-').replaceAll('_', ' ');
const money = (value?: number | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const SellerExchangeRequests = () => {
  const [requests, setRequests] = useState<SellerExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(API_ROUTES.sellerAftercare.exchanges);
        if (!mounted) return;
        setRequests(Array.isArray(response.data) ? response.data : []);
      } catch (requestError: unknown) {
        if (!mounted) return;
        setError(
          getErrorMessage(requestError, 'Failed to load exchange requests'),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(requests.map((request) => request.status).filter(Boolean)),
      ) as string[],
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === 'ALL' || request.status === statusFilter;
      const searchableText = [
        request.requestNumber || '',
        String(request.oldOrderId || ''),
        request.customerName || '',
        request.oldProductTitle || '',
        request.newProductTitle || '',
        request.exchangeReason || '',
        request.taxAdjustment?.summary || '',
      ]
        .join(' ')
        .toLowerCase();
      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [requests, searchQuery, statusFilter]);

  return (
    <div className="space-y-5">
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Exchange Requests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Read-only exchange visibility for sellers, now with net GST and payout
          delta preview from the tax snapshot plus replacement pricing.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        sx={{
          p: 3,
          borderRadius: '24px',
          border: '1px solid #eef2f7',
          boxShadow: 'none',
        }}
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TextField
            size="small"
            placeholder="Search by request, order, customer or product"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 320 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All Requests</MenuItem>
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '20px',
            boxShadow: 'none',
            border: '1px solid #eef2f7',
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Request</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Swap</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Price Diff</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tax Adjustment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No exchange requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {request.requestNumber || `EXC-${request.id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Order #{request.oldOrderId}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.customerName || 'Customer'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {request.oldProductTitle || 'Old Product'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        New: {request.newProductTitle || 'Pending selection'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {money(request.priceSummary?.priceDifference)}
                    </TableCell>
                    <TableCell>
                      {request.taxAdjustment ? (
                        <div className="flex flex-col gap-1">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {label(request.taxAdjustment.noteType)} /{' '}
                            {label(request.taxAdjustment.postingStatus)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            GST{' '}
                            {money(request.taxAdjustment.netDelta?.gstAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Net{' '}
                            {money(
                              request.taxAdjustment.netDelta
                                ?.sellerPayableAmount,
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.taxAdjustment.summary || '-'}
                          </Typography>
                        </div>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No tax delta yet
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={request.status || 'PENDING'}
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {request.requestedAt
                        ? new Date(request.requestedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default SellerExchangeRequests;
