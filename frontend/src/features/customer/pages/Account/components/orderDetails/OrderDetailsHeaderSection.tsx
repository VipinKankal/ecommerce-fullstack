import React from 'react';
import { Alert, Chip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { statusTone } from 'features/courier/courierData';
import {
  OrderLite,
  prettyLabel,
  resolveCustomerPaymentMessage,
  resolvePaymentTypeLabel,
} from '../../orderDetailsTypes';

type OrderDetailsHeaderSectionProps = {
  customerStatus: string;
  paymentStatus?: string;
  latestExchangeStatus?: string;
  cancelSuccess: string | null;
  exchangeSuccess: string | null;
  exchangeError: string | null;
  onCloseExchangeSuccess: () => void;
  onCloseExchangeError: () => void;
  order: OrderLite;
  trackingCompleted: number;
  trackingTotal: number;
  returnRefundLoading: boolean;
  exchangeLoading: boolean;
};

const OrderDetailsHeaderSection = ({
  customerStatus,
  paymentStatus,
  latestExchangeStatus,
  cancelSuccess,
  exchangeSuccess,
  exchangeError,
  onCloseExchangeSuccess,
  onCloseExchangeError,
  order,
  trackingCompleted,
  trackingTotal,
  returnRefundLoading,
  exchangeLoading,
}: OrderDetailsHeaderSectionProps) => (
  <>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Order Tracking
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          Tracking now follows fulfillment, shipment, refund and exchange states
          together.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Chip
          label={customerStatus.replaceAll('_', ' ')}
          color={statusTone(customerStatus)}
          sx={{ fontWeight: 'bold', borderRadius: '8px' }}
        />
        <Chip
          label={paymentStatus || 'PENDING'}
          color={statusTone(paymentStatus)}
          variant="outlined"
          sx={{ borderRadius: '8px' }}
        />
        {latestExchangeStatus && (
          <Chip
            label={prettyLabel(latestExchangeStatus)}
            color={statusTone(latestExchangeStatus)}
            variant="outlined"
            sx={{ borderRadius: '8px', fontWeight: 700 }}
          />
        )}
      </div>
    </div>

    {cancelSuccess && <Alert severity="success">{cancelSuccess}</Alert>}
    {exchangeSuccess && (
      <Alert severity="success" onClose={onCloseExchangeSuccess}>
        {exchangeSuccess}
      </Alert>
    )}
    {exchangeError && (
      <Alert severity="error" onClose={onCloseExchangeError}>
        {exchangeError}
      </Alert>
    )}

    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">
      <div className="p-4 border rounded-2xl bg-white shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors">
        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
          <HomeIcon className="text-blue-600" sx={{ fontSize: 20 }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-bold uppercase text-[10px] tracking-widest text-gray-400">
              Delivery Address
            </h2>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <p className="text-[11px] font-bold text-blue-600 truncate">
              {order.shippingAddress?.mobileNumber || 'N/A'}
            </p>
          </div>
          <p className="font-black text-gray-900 text-sm leading-tight mb-0.5">
            {order.shippingAddress?.name || 'N/A'}
          </p>
          <p className="text-gray-500 text-xs truncate leading-relaxed">
            {order.shippingAddress?.address}, {order.shippingAddress?.locality},{' '}
            {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
            <span className="font-bold text-gray-700">
              {order.shippingAddress?.pinCode}
            </span>
          </p>
        </div>
      </div>

      <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
          Delivery Promise
        </div>
        <div className="text-sm font-semibold text-gray-900">
          {order.deliveryWindow || order.estimatedDelivery || 'Today by 6 PM'}
        </div>
        <div className="text-xs text-gray-500">
          Timeline: {trackingCompleted}/{trackingTotal} milestones complete
        </div>
        <div className="text-xs text-gray-500">
          Payment Method: {order.paymentMethod || 'N/A'}
          {resolvePaymentTypeLabel(order)
            ? ` | Type: ${resolvePaymentTypeLabel(order)}`
            : ''}
          {order.provider ? ` | Provider: ${order.provider}` : ''}
        </div>
        {resolveCustomerPaymentMessage(order) && (
          <div className="text-xs font-medium text-gray-700">
            {resolveCustomerPaymentMessage(order)}
          </div>
        )}
        {(returnRefundLoading || exchangeLoading) && (
          <div className="text-xs text-gray-500">
            Checking refund and exchange updates...
          </div>
        )}
      </div>
    </div>
  </>
);

export default OrderDetailsHeaderSection;
