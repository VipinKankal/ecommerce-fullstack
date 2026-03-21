import React, { useEffect } from 'react';
import {
  Alert,
  Chip,
  ChipProps,
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
import { adminOrdersList } from 'State/backend/MasterApiThunks';
import { useAppDispatch, useAppSelector } from 'app/store/Store';

type AdminOrderRow = {
  id: number;
  orderDate?: string;
  customerName?: string;
  customerEmail?: string;
  sellerName?: string;
  orderStatus?: string;
  paymentStatus?: string;
  totalSellingPrice?: number;
  totalItems?: number;
};

const AdminOrders = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const orders = Array.isArray(responses.adminOrdersList)
    ? (responses.adminOrdersList as AdminOrderRow[])
    : [];

  const getOrderStatusColor = (status?: string): ChipProps['color'] => {
    switch ((status || '').toUpperCase()) {
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
      case 'CONFIRMED':
        return 'info';
      default:
        return 'warning';
    }
  };

  const getPaymentStatusColor = (status?: string): ChipProps['color'] => {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'REFUNDED':
        return 'info';
      default:
        return 'warning';
    }
  };

  useEffect(() => {
    dispatch(adminOrdersList());
  }, [dispatch]);

  return (
    <div className="space-y-5">
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Order Monitoring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Admin overview of placed orders, payment state, and seller ownership.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '24px',
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Order Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      #{order.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.orderDate
                        ? new Date(order.orderDate).toLocaleString()
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {order.customerName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.customerEmail || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.sellerName || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={order.orderStatus || 'N/A'}
                      color={getOrderStatusColor(order.orderStatus)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={order.paymentStatus || 'N/A'}
                      color={getPaymentStatusColor(order.paymentStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Rs {order.totalSellingPrice}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.totalItems} items
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminOrders;
