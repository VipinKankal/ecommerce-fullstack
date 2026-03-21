export type ProductLite = {
  id: number;
  title?: string;
  description?: string;
  images?: string[];
};

export type OrderItemLite = {
  id: number;
  product?: ProductLite;
  size?: string;
  quantity?: number;
};

export type AddressLite = {
  name?: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  mobileNumber?: string;
};

export type CourierLite = { fullName?: string; name?: string; phone?: string };

export type DeliveryHistoryLite = {
  id?: number;
  status?: string;
  reason?: string;
  note?: string;
  proofUrl?: string;
  updatedBy?: string;
  updatedAt?: string;
};

export type ReturnRefundRequestLite = {
  orderItemId?: number | string;
  requestNumber?: string;
  status?: string;
  returnReason?: string;
  requestedAt?: string;
  pickupScheduledAt?: string;
  pickupCompletedAt?: string;
  refundPendingAt?: string;
  refundInitiatedAt?: string;
  refundCompletedAt?: string;
  refund?: { eligibleAfter?: string; status?: string } | null;
  history?: Array<{
    status?: string;
    note?: string;
    createdAt?: string;
    updatedBy?: string;
  }>;
};

export type OrderLite = {
  id: number;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentType?: string;
  provider?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
  deliveryTaskStatus?: string;
  deliveryStatusReason?: string;
  deliveryStatusNote?: string;
  cancelReasonCode?: string;
  cancelReasonText?: string;
  cancelledAt?: string;
  orderDate?: string;
  shippingAddress?: AddressLite;
  orderItems?: OrderItemLite[];
  estimatedDelivery?: string;
  deliveryWindow?: string;
  courier?: CourierLite;
  courierName?: string;
  courierPhone?: string;
  deliveryHistory?: DeliveryHistoryLite[];
  deliveryDate?: string;
};

export type CancelReasonOption = { code: string; label: string };

export const cancelAllowed = new Set(['PENDING', 'PLACED', 'CONFIRMED']);
export const prettyLabel = (value?: string | null) =>
  (value || '').replaceAll('_', ' ');

export const resolvePaymentTypeLabel = (order: OrderLite | null) => {
  const paymentType = (order?.paymentType || '').toUpperCase();
  const paymentMethod = (order?.paymentMethod || '').toUpperCase();

  if (paymentType === 'CASH' || paymentMethod === 'COD') return 'Cash';
  if (paymentType === 'UPI' || paymentMethod === 'UPI') return 'UPI';
  if (paymentType === 'CARD' || paymentMethod === 'CARD') return 'Card';
  return paymentType || paymentMethod || '';
};

export const resolveCustomerPaymentMessage = (order: OrderLite | null) => {
  const paymentMethod = (order?.paymentMethod || '').toUpperCase();
  const provider = (order?.provider || '').toUpperCase();

  if (paymentMethod === 'COD') {
    return 'Your order is Cash on Delivery.';
  }

  if (paymentMethod === 'UPI' && provider === 'PHONEPE') {
    return 'Your order will be paid via PhonePe UPI.';
  }

  if (paymentMethod === 'UPI') {
    return 'Your order will be paid via UPI.';
  }

  if (paymentMethod === 'CARD') {
    return 'Your order will be paid online by card.';
  }

  return '';
};

export const resolveCustomerStatus = (order: OrderLite | null) => {
  const rawOrderStatus = (order?.orderStatus || 'PENDING').toUpperCase();
  const shipmentStatus = (
    order?.shipmentStatus || rawOrderStatus
  ).toUpperCase();
  const deliveryTaskStatus = (order?.deliveryTaskStatus || '').toUpperCase();

  if (rawOrderStatus === 'CANCELLED') return 'CANCELLED';
  if (shipmentStatus === 'DELIVERED' || rawOrderStatus === 'DELIVERED') {
    return 'DELIVERED';
  }
  if (deliveryTaskStatus === 'CONFIRMATION_PENDING')
    return 'CONFIRMATION_PENDING';
  if (deliveryTaskStatus === 'ARRIVED') return 'ARRIVED_AT_LOCATION';
  if (shipmentStatus === 'OUT_FOR_DELIVERY') return 'OUT_FOR_DELIVERY';
  if (['IN_TRANSIT', 'HANDED_TO_COURIER'].includes(shipmentStatus)) {
    return 'SHIPPED';
  }
  if ((order?.fulfillmentStatus || '').toUpperCase() === 'FULFILLED') {
    return 'PACKED';
  }
  return rawOrderStatus;
};
