import React, { useEffect } from 'react';
import {
  Alert,
  Button,
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
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';

type AdminOrderRow = {
  id: number;
  orderDate?: string;
  customerName?: string;
  customerEmail?: string;
  sellerName?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentType?: string;
  provider?: string;
  totalSellingPrice?: number;
  totalItems?: number;
};

type AdminOrderAction = 'confirm' | 'pack' | 'ship' | 'cancel';

const AdminOrders = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const [actionLoadingId, setActionLoadingId] = React.useState<number | null>(null);
  const [actionError, setActionError] = React.useState('');
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
      case 'PACKED':
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

  const runOrderAction = async (
    orderId: number,
    action: 'confirm' | 'pack' | 'ship' | 'cancel',
  ) => {
    setActionLoadingId(orderId);
    setActionError('');
    try {
      if (action === 'cancel') {
        await api.post(API_ROUTES.admin.orderActions.cancel(orderId), {
          cancelReasonCode: 'ADMIN_CANCELLED',
          cancelReasonText: 'Cancelled by warehouse admin before shipment',
        });
      } else {
        await api.post(API_ROUTES.admin.orderActions[action](orderId));
      }
      await dispatch(adminOrdersList()).unwrap();
    } catch (requestError) {
      setActionError(
        (requestError as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to update order.',
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const getAvailableActions = (status?: string): AdminOrderAction[] => {
    switch ((status || '').toUpperCase()) {
      case 'INITIATED':
      case 'PENDING':
      case 'PLACED':
        return ['confirm', 'cancel'];
      case 'CONFIRMED':
        return ['pack', 'cancel'];
      case 'PACKED':
        return ['ship', 'cancel'];
      default:
        return [];
    }
  };

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

      {(error || actionError) && <Alert severity="error">{error || actionError}</Alert>}

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
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const actions = getAvailableActions(order.orderStatus);
                return (
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {order.paymentMethod || 'N/A'}
                      {order.provider ? ` | ${order.provider}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Rs {order.totalSellingPrice}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.totalItems} items
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {actions.includes('confirm') && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => runOrderAction(order.id, 'confirm')}
                          disabled={actionLoadingId === order.id}
                        >
                          Confirm
                        </Button>
                      )}
                      {actions.includes('pack') && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => runOrderAction(order.id, 'pack')}
                          disabled={actionLoadingId === order.id}
                        >
                          Pack
                        </Button>
                      )}
                      {actions.includes('ship') && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => runOrderAction(order.id, 'ship')}
                          disabled={actionLoadingId === order.id}
                        >
                          Ship
                        </Button>
                      )}
                      {actions.includes('cancel') && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => runOrderAction(order.id, 'cancel')}
                          disabled={actionLoadingId === order.id}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminOrders;
