import React from 'react';
import OrderItem from '../../OrderItem';
import { OrderItemLite } from '../../orderDetailsTypes';

type OrderDetailsProductInfoProps = {
  orderId: number;
  customerStatus: string;
  item: OrderItemLite | null;
};

const OrderDetailsProductInfo = ({
  orderId,
  customerStatus,
  item,
}: OrderDetailsProductInfoProps) => (
  <div className="space-y-4">
    <h2 className="font-black text-gray-900 text-xl ml-1">Products Info</h2>
    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
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
          <p className="text-sm text-gray-500 p-6 text-center italic">
            No order item details available.
          </p>
        )}
      </div>
    </div>
  </div>
);

export default OrderDetailsProductInfo;
