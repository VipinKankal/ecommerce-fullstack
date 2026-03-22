import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';

type SellerTransferRow = {
  id: number;
  productId?: number;
  productTitle?: string;
  quantity?: number;
  status?: string;
  sellerNote?: string;
  adminNote?: string;
  rejectionReason?: string;
  requestedAt?: string;
  approvedAt?: string;
  pickedUpAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
  pickupMode?: string;
  estimatedWeightKg?: number;
  packageCount?: number;
  preferredVehicle?: string;
  suggestedVehicle?: string;
  estimatedPickupHours?: number;
  estimatedLogisticsCharge?: number;
  packageType?: string;
  pickupReadyAt?: string;
  pickupAddressVerified?: boolean;
  transportMode?: string;
  assignedCourierName?: string;
  transporterName?: string;
  invoiceNumber?: string;
  challanNumber?: string;
};

const SellerTransfers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<SellerTransferRow[]>([]);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadTransfers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(API_ROUTES.sellerTransfers.base);
      setRows(Array.isArray(response.data) ? (response.data as SellerTransferRow[]) : []);
    } catch (requestError) {
      setError(
        (requestError as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to load transfer requests.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const transferStats = useMemo(() => {
    const pending = rows.filter((row) => row.status === 'TRANSFER_PENDING').length;
    const approved = rows.filter((row) => row.status === 'TRANSFER_APPROVED').length;
    const pickedUp = rows.filter((row) => row.status === 'PICKED_UP').length;
    const completed = rows.filter((row) => row.status === 'TRANSFER_COMPLETED').length;
    return { pending, approved, pickedUp, completed };
  }, [rows]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const handleCancel = async (transferId: number) => {
    setActionId(transferId);
    setError('');
    try {
      await api.post(API_ROUTES.sellerTransfers.cancel(transferId));
      await loadTransfers();
    } catch (requestError) {
      setError(
        (requestError as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to cancel transfer.',
      );
    } finally {
      setActionId(null);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'TRANSFER_COMPLETED':
        return 'success';
      case 'TRANSFER_REJECTED':
        return 'error';
      case 'TRANSFER_CANCELLED':
        return 'default';
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Transfer Requests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Seller stock deduct tab hoga jab warehouse request ko receive karega.
          Pending request ko pickup se pehle cancel kiya ja sakta hai.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pending', value: transferStats.pending },
          { label: 'Approved', value: transferStats.approved },
          { label: 'Picked Up', value: transferStats.pickedUp },
          { label: 'Completed', value: transferStats.completed },
        ].map((stat) => (
          <Paper
            key={stat.label}
            sx={{
              p: 3,
              borderRadius: '24px',
              boxShadow: 'none',
              border: '1px solid #eef2f7',
            }}
          >
            <Typography variant="overline" color="text.secondary">
              {stat.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </div>

      <Paper
        sx={{
          p: 3,
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Warehouse Transfer Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track admin approval, pickup and final warehouse receipt.
            </Typography>
          </div>
          <Button onClick={loadTransfers} disabled={loading} variant="outlined">
            Refresh
          </Button>
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
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Logistics</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Admin Note</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No transfer requests created yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {row.productTitle || 'Product'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{row.productId || row.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.quantity || 0}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={getStatusColor(row.status)}
                        label={(row.status || 'TRANSFER_PENDING').replaceAll('_', ' ')}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {(row.pickupMode || 'WAREHOUSE_PICKUP').replaceAll('_', ' ')}
                      </Typography>
                      {row.pickupMode === 'SELLER_DROP' ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Seller drop after admin approval
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {(row.transportMode || 'PLANNING_PENDING').replaceAll('_', ' ')}
                            {row.transportMode === 'INTERNAL_COURIER' && row.assignedCourierName
                              ? ` | ${row.assignedCourierName}`
                              : ''}
                            {row.transportMode === 'EXTERNAL_TRANSPORT' && row.transporterName
                              ? ` | ${row.transporterName}`
                              : ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {row.pickupReadyAt
                              ? `Ready: ${formatDate(row.pickupReadyAt)}`
                              : 'Pickup planning pending'}
                          </Typography>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(row.requestedAt)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.adminNote || row.rejectionReason || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {row.status === 'TRANSFER_PENDING' ? (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleCancel(row.id)}
                          disabled={actionId === row.id}
                        >
                          {actionId === row.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {row.status === 'TRANSFER_COMPLETED'
                            ? `Received ${formatDate(row.receivedAt)}`
                            : row.status === 'PICKED_UP'
                              ? `Picked up ${formatDate(row.pickedUpAt)}`
                              : row.status === 'TRANSFER_APPROVED'
                                ? `Approved ${formatDate(row.approvedAt)}`
                                : '-'}
                        </Typography>
                      )}
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

export default SellerTransfers;
