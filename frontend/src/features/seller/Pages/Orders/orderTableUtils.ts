import {
  SellerOrder,
  SellerOrderStatus,
} from 'State/features/seller/orders/thunks';

export const orderStatusOptions: SellerOrderStatus[] = [
  'INITIATED',
  'PENDING',
  'PLACED',
  'CONFIRMED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURN_REQUESTED',
  'RETURNED',
  'EXCHANGE_REQUESTED',
  'EXCHANGE_SHIPPED',
  'CANCELLED',
];

export const getNextStatusOptions = (
  status?: SellerOrderStatus,
): SellerOrderStatus[] => {
  switch ((status || 'PENDING').toUpperCase() as SellerOrderStatus) {
    case 'INITIATED':
    case 'PENDING':
    case 'PLACED':
    case 'CONFIRMED':
      return ['CANCELLED'];
    default:
      return [];
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
      return 'info';
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
    case 'EXCHANGE_SHIPPED':
      return 'info';
    case 'DELIVERED':
    case 'RETURNED':
      return 'success';
    case 'RETURN_REQUESTED':
    case 'EXCHANGE_REQUESTED':
      return 'warning';
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
