import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Menu,
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
import { MoreVert, SearchRounded, Visibility } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  fetchSellerOrders,
  SellerOrder,
  SellerOrderStatus,
  updateSellerOrderStatus,
} from 'State/features/seller/orders/thunks';
import OrderStatsCards from './components/OrderStatsCards';
import OrderDetailsDialog from './components/OrderDetailsDialog';
import {
  getNextStatusOptions,
  getOrderDate,
  getStatusColor,
  orderStatusOptions,
} from './orderTableUtils';

type StatusFilter = 'ALL' | SellerOrderStatus | 'ACTIVE';

const OrderTable = () => {
  const dispatch = useAppDispatch();
  const { orders, loading, error } = useAppSelector(
    (state) => state.sellerOrder,
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] =
    useState<SellerOrderStatus | null>(null);
  const [viewOrder, setViewOrder] = useState<SellerOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchSellerOrders());
  }, [dispatch]);

  const orderStats = useMemo(() => {
    const delivered = orders.filter(
      (order) => order.orderStatus === 'DELIVERED',
    );
    return {
      total: orders.length,
      active: orders.filter(
        (order) => !['DELIVERED', 'CANCELLED'].includes(order.orderStatus),
      ).length,
      delivered: delivered.length,
      cancelled: orders.filter((order) => order.orderStatus === 'CANCELLED')
        .length,
      deliveredRevenue: delivered.reduce(
        (total, order) => total + Number(order.totalSellingPrice || 0),
        0,
      ),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const status = (order.orderStatus || '').toUpperCase();
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' &&
          !['DELIVERED', 'CANCELLED'].includes(status)) ||
        status === statusFilter;

      const items = order.orderItems || [];
      const searchableText = [
        String(order.id || ''),
        order.user?.fullName || '',
        order.user?.email || '',
        order.shippingAddress?.name || '',
        ...items.map((item) => item?.product?.title || ''),
      ]
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [orders, searchQuery, statusFilter]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    orderId: number,
    orderStatus: SellerOrderStatus,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderId(orderId);
    setSelectedOrderStatus(orderStatus);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderId(null);
    setSelectedOrderStatus(null);
  };

  const handleStatusUpdate = async (orderStatus: SellerOrderStatus) => {
    if (!selectedOrderId) return;
    await dispatch(
      updateSellerOrderStatus({ orderId: selectedOrderId, orderStatus }),
    ).unwrap();
    await dispatch(fetchSellerOrders()).unwrap();
    handleMenuClose();
  };

  return (
    <div className="space-y-5">
      <OrderStatsCards stats={orderStats} />

      <Paper
        sx={{
          p: 3,
          borderRadius: '24px',
          border: '1px solid #eef2f7',
          boxShadow: 'none',
        }}
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Order Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track fulfilment, review buyer details, and update shipment
              status.
            </Typography>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <TextField
              size="small"
              placeholder="Search by order id, customer or product"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">All Orders</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              {orderStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '20px',
            boxShadow: 'none',
            border: '1px solid #eef2f7',
          }}
        >
          <Table sx={{ minWidth: 760 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
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
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: '#2563eb' }}
                      >
                        #{order.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Payment: {order.paymentStatus || 'PENDING'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {order.paymentMethod || 'N/A'}
                        {order.provider ? ` | ${order.provider}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.user?.fullName ||
                          order.shippingAddress?.name ||
                          'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.user?.email ||
                          order.user?.mobileNumber ||
                          order.shippingAddress?.mobileNumber ||
                          '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.totalItems || order.orderItems?.length || 0}{' '}
                        items
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(order.orderItems || [])
                          .slice(0, 2)
                          .map((item) => item?.product?.title || 'Product')
                          .join(', ') || 'No item details'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Rs {order.totalSellingPrice}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        MRP Rs {order.totalMrpPrice}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.orderStatus}
                        color={getStatusColor(order.orderStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{getOrderDate(order)}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          variant="text"
                          onClick={() => setViewOrder(order)}
                        >
                          View
                        </Button>
                        <IconButton
                          onClick={(e) =>
                            handleMenuOpen(e, order.id, order.orderStatus)
                          }
                          disabled={
                            getNextStatusOptions(order.orderStatus).length === 0
                          }
                        >
                          <MoreVert />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {getNextStatusOptions(selectedOrderStatus || undefined).map(
          (status) => (
            <MenuItem key={status} onClick={() => handleStatusUpdate(status)}>
              Mark as {status}
            </MenuItem>
          ),
        )}
      </Menu>

      <OrderDetailsDialog
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        getOrderDate={getOrderDate}
      />
    </div>
  );
};

export default OrderTable;
