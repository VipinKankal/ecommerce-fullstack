import React from 'react';
import { Alert } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import OrderStepper from '../../OrderStepper';
import RefundStatusPanel from '../RefundStatusPanel';
import ExchangeDetailsPage from '../ExchangeDetailsPage';
import { ExchangeRequestRecord } from 'State/features/customer/exchange/slice';
import { OrderLite, ReturnRefundRequestLite } from '../../orderDetailsTypes';

type OrderDetailsJourneySectionProps = {
  rawOrderStatus: string;
  shipmentStatus: string;
  order: OrderLite;
  trackingSteps: Array<{
    key: string;
    label: string;
    completed: boolean;
    active: boolean;
  }>;
  latestReturnRefundRequest: ReturnRefundRequestLite | null;
  returnRefundError: string | null;
  returnRefundOpen: boolean;
  latestExchangeRequest: ExchangeRequestRecord | null;
  onPayDifference: () => void;
  onSelectBalanceMode: () => void;
  onSubmitBankDetails: () => void;
  deliveryTaskStatus: string;
  sanitizedPendingReason: string;
  showCourierCard: boolean;
  courierName?: string;
  courierPhone?: string;
};

const getStepStateLabel = (step: { completed: boolean; active: boolean }) => {
  if (step.completed) return 'Done';
  if (step.active) return 'Current';
  return 'Pending';
};

const OrderDetailsJourneySection = ({
  rawOrderStatus,
  shipmentStatus,
  order,
  trackingSteps,
  latestReturnRefundRequest,
  returnRefundError,
  returnRefundOpen,
  latestExchangeRequest,
  onPayDifference,
  onSelectBalanceMode,
  onSubmitBankDetails,
  deliveryTaskStatus,
  sanitizedPendingReason,
  showCourierCard,
  courierName,
  courierPhone,
}: OrderDetailsJourneySectionProps) => (
  <div className="p-8 border rounded-2xl bg-white shadow-sm space-y-6">
    <div>
      <h2 className="text-center font-bold uppercase text-xs tracking-[0.2em] text-gray-400 mb-10">
        Order Journey
      </h2>
      <OrderStepper
        orderStatus={rawOrderStatus}
        fulfillmentStatus={order.fulfillmentStatus}
        shipmentStatus={shipmentStatus}
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {trackingSteps.map((step) => (
        <div
          key={step.key}
          className={`rounded-2xl border px-4 py-3 text-center ${
            step.active
              ? 'border-black bg-black text-white'
              : step.completed
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">
            {getStepStateLabel(step)}
          </div>
          <div className="text-sm font-semibold mt-1">{step.label}</div>
        </div>
      ))}
    </div>

    {latestReturnRefundRequest && (
      <RefundStatusPanel request={latestReturnRefundRequest} />
    )}
    {returnRefundError && !returnRefundOpen && (
      <Alert severity="error">{returnRefundError}</Alert>
    )}
    {latestExchangeRequest && (
      <ExchangeDetailsPage
        request={latestExchangeRequest as ExchangeRequestRecord}
        onPayDifference={onPayDifference}
        onSelectBalanceMode={onSelectBalanceMode}
        onSubmitBankDetails={onSubmitBankDetails}
      />
    )}

    {deliveryTaskStatus === 'CONFIRMATION_PENDING' && (
      <Alert severity="warning">
        Delivery confirmation pending. OTP has been sent to your registered
        email.
        {sanitizedPendingReason ? ` ${sanitizedPendingReason}` : ''}
      </Alert>
    )}

    {!!order.deliveryHistory?.length && (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
          Delivery Status History
        </div>
        <div className="space-y-3">
          {order.deliveryHistory.map((entry) => (
            <div
              key={entry.id || `${entry.status}-${entry.updatedAt}`}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="font-semibold text-slate-900 text-sm">
                  {(entry.status || 'UPDATE').replaceAll('_', ' ')}
                </div>
                <div className="text-xs text-slate-500">
                  {entry.updatedAt
                    ? new Date(entry.updatedAt).toLocaleString()
                    : '-'}
                </div>
              </div>
              {(entry.reason || entry.note) && (
                <div className="mt-2 text-sm text-slate-600">
                  {entry.reason && <div>Reason: {entry.reason}</div>}
                  {entry.note && <div>Note: {entry.note}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {showCourierCard && (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <LocalShippingOutlinedIcon className="text-slate-700" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
              Courier Info
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {courierName || 'Assigned courier will appear here'}
            </div>
            <div className="text-sm text-slate-500">
              Phone: {courierPhone || '98xxxxxxx'}
            </div>
            {order.deliveryStatusReason && (
              <div className="text-xs text-slate-500 mt-1">
                Latest Update: {order.deliveryStatusReason}
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-slate-600">
          Expected Delivery:{' '}
          <span className="font-semibold text-slate-900">
            {order.deliveryWindow || order.estimatedDelivery || 'Today 6PM'}
          </span>
        </div>
      </div>
    )}

    {rawOrderStatus === 'CANCELLED' && (
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
        <p className="font-bold uppercase text-[10px] tracking-wider mb-1">
          Reason for Cancellation
        </p>
        <p className="font-medium">{order.cancelReasonCode || 'N/A'}</p>
        {(order.cancelReasonText || order.deliveryStatusReason) && (
          <p className="mt-1 opacity-80">
            {order.cancelReasonText || order.deliveryStatusReason}
          </p>
        )}
        {order.cancelledAt && (
          <p className="mt-1 opacity-80">
            Cancelled At: {new Date(order.cancelledAt).toLocaleString()}
          </p>
        )}
      </div>
    )}
  </div>
);

export default OrderDetailsJourneySection;
