import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Collapse,
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
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { SearchRounded } from '@mui/icons-material';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

type AmountBlock = {
  grossAmount?: number;
  taxableAmount?: number;
  gstAmount?: number;
  commissionAmount?: number;
  commissionGstAmount?: number;
  tcsAmount?: number;
  sellerPayableAmount?: number;
  currencyCode?: string;
};

type TaxAdjustmentSummary = {
  noteType?: string;
  postingStatus?: string;
  summary?: string;
  original?: AmountBlock | null;
  delta?: AmountBlock | null;
};

type SellerReturnRequest = {
  id: number;
  requestNumber?: string;
  orderId?: number;
  customerName?: string;
  status?: string;
  returnReason?: string;
  productTitle?: string;
  quantityRequested?: number;
  requestedAt?: string;
  taxAdjustment?: TaxAdjustmentSummary | null;
};

const label = (value?: string | null) => (value || '-').replaceAll('_', ' ');
const money = (value?: number | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const SellerReturnAdjustmentsPage = () => {
  const [requests, setRequests] = useState<SellerReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(API_ROUTES.sellerAftercare.returns);
        if (!mounted) return;
        setRequests(Array.isArray(response.data) ? response.data : []);
      } catch (requestError: unknown) {
        if (!mounted) return;
        setError(
          getErrorMessage(requestError, 'Failed to load return requests'),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
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
        String(request.orderId || ''),
        request.customerName || '',
        request.productTitle || '',
        request.returnReason || '',
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
          Return Requests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Snapshot-backed return adjustments with ledger drill-down for GST,
          commission, and payable reversal.
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
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tax Adjustment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ledger Drill-down</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No return requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <React.Fragment key={request.id}>
                    <TableRow hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {request.requestNumber || `RET-${request.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Order #{request.orderId}
                        </Typography>
                      </TableCell>
                      <TableCell>{request.customerName || 'Customer'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {request.productTitle || 'Product'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty {request.quantityRequested || 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {request.taxAdjustment ? (
                          <div className="flex flex-col gap-1">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {label(request.taxAdjustment.noteType)} /{' '}
                              {label(request.taxAdjustment.postingStatus)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Net{' '}
                              {money(
                                request.taxAdjustment.delta?.sellerPayableAmount,
                              )}
                            </Typography>
                          </div>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No tax reversal yet
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={request.status || 'PENDING'}
                          color="warning"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            expandedId === request.id ? (
                              <KeyboardArrowUpRoundedIcon />
                            ) : (
                              <KeyboardArrowDownRoundedIcon />
                            )
                          }
                          onClick={() =>
                            setExpandedId((current) =>
                              current === request.id ? null : request.id,
                            )
                          }
                        >
                          {expandedId === request.id ? 'Hide' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0 }}>
                        <Collapse in={expandedId === request.id} timeout="auto" unmountOnExit>
                          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                            <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                Original Snapshot Line
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Gross {money(request.taxAdjustment?.original?.grossAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Taxable {money(request.taxAdjustment?.original?.taxableAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                GST {money(request.taxAdjustment?.original?.gstAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Commission {money(request.taxAdjustment?.original?.commissionAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Seller Payable {money(request.taxAdjustment?.original?.sellerPayableAmount)}
                              </Typography>
                            </Paper>

                            <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #fecaca', backgroundColor: '#fff7ed', boxShadow: 'none' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                Adjustment Delta (Reversal)
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Gross {money(request.taxAdjustment?.delta?.grossAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                GST {money(request.taxAdjustment?.delta?.gstAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                TCS {money(request.taxAdjustment?.delta?.tcsAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Seller Payable {money(request.taxAdjustment?.delta?.sellerPayableAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {request.taxAdjustment?.summary || '-'}
                              </Typography>
                            </Paper>
                          </div>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default SellerReturnAdjustmentsPage;

