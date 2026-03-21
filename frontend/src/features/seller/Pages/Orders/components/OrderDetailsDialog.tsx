import React from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { SellerOrder } from 'State/features/seller/orders/thunks';

interface SellerOrderItem {
  id?: number | string;
  size?: string;
  quantity?: number;
  sellingPrice?: number;
  product?: {
    title?: string;
    description?: string;
  };
}

interface OrderDetailsDialogProps {
  order: SellerOrder | null;
  onClose: () => void;
  getOrderDate: (order: SellerOrder) => string;
}

const OrderDetailsDialog = ({
  order,
  onClose,
  getOrderDate,
}: OrderDetailsDialogProps) => {
  return (
    <Dialog open={Boolean(order)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Order Details</DialogTitle>
      <DialogContent>
        {order && (
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Paper
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  boxShadow: 'none',
                  border: '1px solid #eef2f7',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                  Order Summary
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Order ID:</strong> #{order.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {order.orderStatus}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payment Status:</strong>{' '}
                    {order.paymentStatus || 'PENDING'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payment Method:</strong> {order.paymentMethod || 'N/A'}
                    {order.paymentType ? ` | ${order.paymentType}` : ''}
                    {order.provider ? ` | ${order.provider}` : ''}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Items:</strong>{' '}
                    {order.totalItems || order.orderItems?.length || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Selling:</strong> Rs {order.totalSellingPrice}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total MRP:</strong> Rs {order.totalMrpPrice}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong> {getOrderDate(order)}
                  </Typography>
                </Stack>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  boxShadow: 'none',
                  border: '1px solid #eef2f7',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                  Shipping Details
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Name:</strong>{' '}
                    {order.shippingAddress?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Mobile:</strong>{' '}
                    {order.shippingAddress?.mobileNumber || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Address:</strong>{' '}
                    {[
                      order.shippingAddress?.address,
                      order.shippingAddress?.locality,
                      order.shippingAddress?.city,
                      order.shippingAddress?.state,
                      order.shippingAddress?.pinCode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'N/A'}
                  </Typography>
                </Stack>
              </Paper>
            </div>

            <Paper
              sx={{
                p: 2,
                borderRadius: '16px',
                boxShadow: 'none',
                border: '1px solid #eef2f7',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800 }}>
                Order Items
              </Typography>

              {(order.orderItems || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No item details available.
                </Typography>
              ) : (
                <div className="space-y-3">
                  {(order.orderItems as SellerOrderItem[]).map((item) => (
                    <div
                      key={`${String(item.id || 'item')}-${item.product?.title || 'product'}-${item.size || '-'}`}
                      className="rounded-2xl border border-gray-100 p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {item.product?.title || 'Product'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.product?.description || 'No description'}
                          </Typography>
                        </div>
                        <Chip
                          size="small"
                          label={`Qty ${item.quantity || 0}`}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>Size: {item.size || '-'}</span>
                        <span>Price: Rs {item.sellingPrice || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Paper>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailsDialog;
