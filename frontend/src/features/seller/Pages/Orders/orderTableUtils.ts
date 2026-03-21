import {
  SellerOrder,
  SellerOrderStatus,
} from 'State/features/seller/orders/thunks';

export const orderStatusOptions: SellerOrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export const getNextStatusOptions = (
  status?: SellerOrderStatus,
): SellerOrderStatus[] => {
  switch ((status || 'PENDING').toUpperCase() as SellerOrderStatus) {
    case 'PENDING':
    case 'PLACED':
      return ['CONFIRMED', 'CANCELLED'];
    case 'CONFIRMED':
      return ['SHIPPED', 'CANCELLED'];
    case 'SHIPPED':
      return ['OUT_FOR_DELIVERY'];
    case 'OUT_FOR_DELIVERY':
      return ['DELIVERED'];
    default:
      return [];
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      return 'info';
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

export const getOrderDate = (order: SellerOrder) => {
  const raw = order.createdAt || order.orderDate;
  if (!raw) return '-';
  return new Date(raw).toLocaleDateString();
};
