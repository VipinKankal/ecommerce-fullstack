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
};

type ExchangeTaxAdjustmentSummary = {
  noteType?: string;
  postingStatus?: string;
  summary?: string;
  oldItemReversal?: AmountBlock | null;
  replacementCharge?: AmountBlock | null;
  netDelta?: AmountBlock | null;
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

const SellerExchangeAdjustmentsPage = () => {
  const [requests, setRequests] = useState<SellerExchangeRequest[]>([]);
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
          Snapshot-backed exchange adjustments with replacement charge and
          net-ledger delta drill-down.
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
                    No exchange requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <React.Fragment key={request.id}>
                    <TableRow hover>
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
                        {request.taxAdjustment ? (
                          <div className="flex flex-col gap-1">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {label(request.taxAdjustment.noteType)} /{' '}
                              {label(request.taxAdjustment.postingStatus)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Net{' '}
                              {money(request.taxAdjustment.netDelta?.sellerPayableAmount)}
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
                          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
                            <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                Old Item Reversal
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Gross {money(request.taxAdjustment?.oldItemReversal?.grossAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                GST {money(request.taxAdjustment?.oldItemReversal?.gstAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Seller Payable {money(request.taxAdjustment?.oldItemReversal?.sellerPayableAmount)}
                              </Typography>
                            </Paper>

                            <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', boxShadow: 'none' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                Replacement Charge
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Gross {money(request.taxAdjustment?.replacementCharge?.grossAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                GST {money(request.taxAdjustment?.replacementCharge?.gstAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Seller Payable {money(request.taxAdjustment?.replacementCharge?.sellerPayableAmount)}
                              </Typography>
                            </Paper>

                            <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #fecaca', backgroundColor: '#fff7ed', boxShadow: 'none' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                Net Ledger Delta
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Gross {money(request.taxAdjustment?.netDelta?.grossAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                GST {money(request.taxAdjustment?.netDelta?.gstAmount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Seller Payable {money(request.taxAdjustment?.netDelta?.sellerPayableAmount)}
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

export default SellerExchangeAdjustmentsPage;

