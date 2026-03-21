import React from 'react';
import { Button, Chip, Paper, Typography } from '@mui/material';
import { formatMoney, statusTone } from 'features/courier/courierData';
import { AdminOrderRow } from '../../types';

type AdminCourierOrdersSectionProps = {
  onOpenTracking: (orderId: number | string) => void | Promise<void>;
  orders: AdminOrderRow[];
};

const AdminCourierOrdersSection = ({
  onOpenTracking,
  orders,
}: AdminCourierOrdersSectionProps) => (
  <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
    <Typography variant="h6" sx={{ fontWeight: 800 }}>
      Orders Management
    </Typography>
    <div className="grid grid-cols-1 gap-3">
      {orders.map((order) => (
        <div
          key={String(order.id)}
          className="rounded-3xl border border-slate-200 p-4 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center"
        >
          <div>
            <div className="font-semibold text-slate-900">ORD{order.id}</div>
            <div className="text-sm text-slate-500">
              {order.customerName || 'Customer'} -{' '}
              {order.customerPhone || order.city || '-'}
            </div>
            <div className="text-xs text-slate-400">
              {order.address || order.city || 'Address pending'}
            </div>
          </div>
          <div className="space-y-2">
            <Chip
              size="small"
              label={order.paymentMethod || '-'}
              color={statusTone(order.paymentStatus)}
            />
            <div className="text-xs text-slate-500">
              {order.paymentStatus || '-'}
            </div>
          </div>
          <div className="space-y-2">
            <Chip
              size="small"
              label={order.fulfillmentStatus || order.orderStatus || '-'}
              color={statusTone(order.fulfillmentStatus || order.orderStatus)}
            />
            <div className="text-xs text-slate-500">
              Shipment {order.shipmentStatus || 'LABEL_CREATED'}
            </div>
          </div>
          <div className="text-sm text-slate-500">
            <div>Courier: {order.courierName || 'Unassigned'}</div>
            <div>{order.deliveryWindow || 'Today 2PM - 6PM'}</div>
          </div>
          <div className="text-sm text-slate-500">
            <div>{order.city || '-'}</div>
            <div>{formatMoney(order.totalSellingPrice)}</div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="small"
              variant="outlined"
              onClick={() => onOpenTracking(order.id)}
            >
              View Tracking
            </Button>
          </div>
        </div>
      ))}
      {!orders.length && (
        <Typography color="text.secondary">
          No orders available for courier operations.
        </Typography>
      )}
    </div>
  </Paper>
);

export default AdminCourierOrdersSection;
