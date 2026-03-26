import React from 'react';
import OrderItem from '../../OrderItem';
import { OrderItemLite, OrderTaxSnapshotLite } from '../../orderDetailsTypes';

type OrderDetailsProductInfoProps = {
  orderId: number;
  customerStatus: string;
  item: OrderItemLite | null;
  orderTaxSnapshot?: OrderTaxSnapshotLite | null;
};

const formatMoney = (value?: number | null) =>
  value == null
    ? '-'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(value);

const OrderDetailsProductInfo = ({
  orderId,
  customerStatus,
  item,
  orderTaxSnapshot,
}: OrderDetailsProductInfoProps) => (
  <div className="space-y-4">
    <h2 className="ml-1 text-xl font-black text-gray-900">Products Info</h2>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Order ID: #{orderId}
        </span>
        <span className="text-xs font-bold text-blue-600">
          {customerStatus.replaceAll('_', ' ')}
        </span>
      </div>
      <div className="p-2">
        {item ? (
          <OrderItem
            id={item.id}
            orderId={orderId}
            title={item.product?.title || 'Product'}
            description={item.product?.description}
            size={item.size}
            image={item.product?.images?.[0]}
            orderStatus={customerStatus}
          />
        ) : (
          <p className="p-6 text-center text-sm italic text-gray-500">
            No order item details available.
          </p>
        )}
      </div>
    </div>

    {orderTaxSnapshot && (
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-emerald-50 px-6 py-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Frozen Tax Snapshot
          </span>
          <span className="text-xs font-semibold text-emerald-900">
            Rule {orderTaxSnapshot.gstRuleVersion || 'N/A'}
            {orderTaxSnapshot.effectiveTaxDate
              ? ` | Effective ${orderTaxSnapshot.effectiveTaxDate}`
              : ''}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 p-6 text-sm text-slate-700 md:grid-cols-3">
          <div>
            <strong>Taxable Value:</strong>{' '}
            {formatMoney(orderTaxSnapshot.totalTaxableValue)}
          </div>
          <div>
            <strong>Total GST:</strong>{' '}
            {formatMoney(orderTaxSnapshot.totalGstAmount)}
          </div>
          <div>
            <strong>TCS:</strong> {formatMoney(orderTaxSnapshot.tcsAmount)}
          </div>
          <div>
            <strong>Commission GST:</strong>{' '}
            {formatMoney(orderTaxSnapshot.totalCommissionGstAmount)}
          </div>
          <div>
            <strong>Total Charged:</strong>{' '}
            {formatMoney(orderTaxSnapshot.totalAmountCharged)}
          </div>
          <div>
            <strong>Supply Type:</strong>{' '}
            {orderTaxSnapshot.supplyType || '-'}
          </div>
          <div>
            <strong>Snapshot Source:</strong>{' '}
            {orderTaxSnapshot.snapshotSource || '-'}
          </div>
          <div>
            <strong>Frozen At:</strong> {orderTaxSnapshot.frozenAt || '-'}
          </div>
          <div>
            <strong>TCS Rule:</strong> {orderTaxSnapshot.tcsRuleVersion || '-'}
          </div>
        </div>
      </div>
    )}
  </div>
);

export default OrderDetailsProductInfo;
