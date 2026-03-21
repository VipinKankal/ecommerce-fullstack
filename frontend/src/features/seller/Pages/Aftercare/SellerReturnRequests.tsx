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
};

const SellerReturnRequests = () => {
  const [requests, setRequests] = useState<SellerReturnRequest[]>([]);
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
        const response = await api.get(API_ROUTES.sellerAftercare.returns);
        if (!mounted) return;
        setRequests(Array.isArray(response.data) ? response.data : []);
      } catch (requestError: unknown) {
        if (!mounted) return;
        setError(getErrorMessage(requestError, 'Failed to load return requests'));
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
        String(request.orderId || ''),
        request.customerName || '',
        request.productTitle || '',
        request.returnReason || '',
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
          Read-only return visibility for seller operations. Admin handles
          approval, rejection, and warehouse stock updates.
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
                <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
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
                  <TableRow key={request.id} hover>
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
                    <TableCell>{request.returnReason || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={request.status || 'PENDING'}
                        color="warning"
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

export default SellerReturnRequests;
