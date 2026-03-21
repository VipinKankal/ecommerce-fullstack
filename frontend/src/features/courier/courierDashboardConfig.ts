import { CodCollectionMode, CourierAssignmentItem } from './courierTypes';

export type CourierTab =
  | 'deliveries'
  | 'returnPickups'
  | 'exchangePickups'
  | 'delivered'
  | 'cod'
  | 'petrol'
  | 'earnings';

export type ReversePickupTaskRecord = {
  id: number | string;
  requestId?: number | string;
  orderId?: number | string;
  orderItemId?: number | string;
  requestType?: string;
  returnStatus?: string;
  reasonCode?: string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  productTitle?: string;
  productImage?: string;
  amount?: number;
  status?: string;
  pickupNote?: string;
  proofUrl?: string;
  scheduledAt?: string;
  pickedAt?: string;
  completedAt?: string;
  courierName?: string;
  courierPhone?: string;
};

type ReversePickupTaskSource = {
  id?: number | string;
  taskId?: number | string;
  requestId?: number | string;
  returnRequestId?: number | string;
  orderId?: number | string;
  orderItemId?: number | string;
  requestType?: string;
  returnStatus?: string;
  reasonCode?: string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  productTitle?: string;
  productImage?: string;
  amount?: number | string;
  status?: string;
  pickupNote?: string;
  note?: string;
  proofUrl?: string;
  scheduledAt?: string;
  pickedAt?: string;
  completedAt?: string;
  courierName?: string;
  courierPhone?: string;
};

export const reversePickupReadyStatuses = new Set([
  'RETURN_APPROVED',
  'RETURN_PICKUP_SCHEDULED',
  'EXCHANGE_APPROVED',
  'EXCHANGE_PICKUP_SCHEDULED',
]);

export const reversePickupCompletedStatuses = new Set([
  'RETURN_PICKED',
  'OLD_PRODUCT_PICKED',
  'RETURN_RECEIVED',
  'REFUND_INITIATED',
  'REFUND_COMPLETED',
  'REPLACEMENT_ORDER_CREATED',
  'REPLACEMENT_SHIPPED',
  'REPLACEMENT_DELIVERED',
  'EXCHANGE_COMPLETED',
]);

export const mapReversePickupTask = (
  item: ReversePickupTaskSource,
): ReversePickupTaskRecord => ({
  id:
    item?.id ??
    item?.taskId ??
    item?.requestId ??
    item?.returnRequestId ??
    'unassigned',
  requestId: item?.requestId ?? item?.returnRequestId,
  orderId: item?.orderId,
  orderItemId: item?.orderItemId,
  requestType: item?.requestType,
  returnStatus: item?.returnStatus,
  reasonCode: item?.reasonCode,
  customerName: item?.customerName,
  customerPhone: item?.customerPhone,
  pickupAddress: item?.pickupAddress,
  productTitle: item?.productTitle,
  productImage: item?.productImage,
  amount:
    typeof item?.amount === 'number' ? item.amount : Number(item?.amount || 0),
  status: (item?.status || 'PICKUP_SCHEDULED').toUpperCase(),
  pickupNote: item?.pickupNote || item?.note,
  proofUrl: item?.proofUrl,
  scheduledAt: item?.scheduledAt,
  pickedAt: item?.pickedAt,
  completedAt: item?.completedAt,
  courierName: item?.courierName,
  courierPhone: item?.courierPhone,
});

export const mergeAssignmentsWithReverseTasks = (
  assignmentItems: CourierAssignmentItem[],
  reverseTasks: ReversePickupTaskRecord[],
): CourierAssignmentItem[] => {
  if (!reverseTasks.length) return assignmentItems;

  const mergedAssignments = assignmentItems.map((task) => {
    if (task.taskFlow !== 'RETURN') {
      return task;
    }

    const matchedTask = reverseTasks.find((reverseTask) => {
      const candidateRequestId = task.returnId ?? task.id;
      return (
        String(reverseTask.requestId ?? '') === String(candidateRequestId ?? '')
      );
    });

    if (!matchedTask) {
      return task;
    }

    return {
      ...task,
      orderId: task.orderId ?? matchedTask.orderId ?? task.id,
      returnId: task.returnId ?? matchedTask.requestId,
      customerName: task.customerName || matchedTask.customerName || 'Customer',
      customerPhone: task.customerPhone || matchedTask.customerPhone,
      address:
        task.address || matchedTask.pickupAddress || 'Address unavailable',
      amount: task.amount || matchedTask.amount || 0,
      itemTitle: task.itemTitle || matchedTask.productTitle,
      returnReason: task.returnReason || matchedTask.reasonCode,
      reverseType:
        task.reverseType ||
        (matchedTask.requestType === 'EXCHANGE' ? 'EXCHANGE' : 'RETURN'),
      reverseTaskId: matchedTask.id,
      reversePickupTaskStatus: matchedTask.status,
      reverseScheduledAt: matchedTask.scheduledAt,
      reversePickedAt: matchedTask.pickedAt,
      proofPhotoUrl: matchedTask.proofUrl || task.proofPhotoUrl,
      statusNote: matchedTask.pickupNote || task.statusNote,
      courierName: task.courierName || matchedTask.courierName,
      courierPhone: task.courierPhone || matchedTask.courierPhone,
      returnStatus: matchedTask.returnStatus || task.returnStatus,
    };
  });

  const syntheticAssignments = reverseTasks
    .filter(
      (reverseTask) =>
        !mergedAssignments.some((task) => {
          if (task.taskFlow !== 'RETURN') {
            return false;
          }

          const candidateRequestId =
            task.returnId ?? task.reverseTaskId ?? task.id;
          return (
            String(candidateRequestId ?? '') ===
            String(reverseTask.requestId ?? '')
          );
        }),
    )
    .map(
      (reverseTask): CourierAssignmentItem => ({
        id: reverseTask.id,
        orderId: reverseTask.orderId ?? reverseTask.requestId ?? reverseTask.id,
        returnId: reverseTask.requestId,
        customerName: reverseTask.customerName || 'Customer',
        customerPhone: reverseTask.customerPhone,
        address: reverseTask.pickupAddress || 'Address unavailable',
        paymentType: 'PAID',
        paymentStatus: 'PAID',
        amount: reverseTask.amount || 0,
        courierName: reverseTask.courierName,
        courierPhone: reverseTask.courierPhone,
        courierTaskStatus: 'ASSIGNED',
        shipmentStatus: 'LABEL_CREATED',
        requiresOtp: false,
        taskFlow: 'RETURN',
        reverseType:
          reverseTask.requestType === 'EXCHANGE' ? 'EXCHANGE' : 'RETURN',
        reverseTaskId: reverseTask.id,
        reversePickupTaskStatus: reverseTask.status,
        reverseScheduledAt: reverseTask.scheduledAt,
        reversePickedAt: reverseTask.pickedAt,
        returnStatus: reverseTask.returnStatus,
        returnReason: reverseTask.reasonCode,
        itemTitle: reverseTask.productTitle,
        proofPhotoUrl: reverseTask.proofUrl,
        statusNote: reverseTask.pickupNote,
      }),
    );

  return [...mergedAssignments, ...syntheticAssignments];
};

export const OTP_LENGTH = 6;
export const OTP_COOLDOWN_SECONDS = 30;

export const monthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const initialCodForm = {
  amount: '',
  mode: 'CASH' as CodCollectionMode,
  referenceId: '',
  settlementDate: '',
};

export const initialPetrolForm = {
  claimMonth: monthValue(),
  amount: '',
  receiptUrl: '',
  notes: '',
};

export const paymentModeOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'Online' },
];

export const statusReasonOptions: Record<string, string[]> = {
  ASSIGNED: [
    'Auto assigned by system',
    'Assigned by admin',
    'Reassigned from another courier',
    'Zone based assignment',
    'Batch dispatch assignment',
  ],
  PICKED_UP: [
    'Picked up from warehouse',
    'Picked up from seller',
    'Picked up from dispatch center',
    'Package verified and collected',
    'Ready for delivery route',
  ],
  OUT_FOR_DELIVERY: [
    'Left delivery hub',
    'Started delivery route',
    'Going to customer address',
    'Delivery scheduled in current slot',
    'Route started after pickup',
  ],
  ARRIVED: [
    'Reached customer address',
    'At gate / building entrance',
    'Waiting for customer',
    'Calling customer',
    'Customer requested wait',
  ],
  DELIVERED: [
    'OTP verified successfully',
    'Delivered to customer',
    'Delivered after COD collection',
    'Delivered after online confirmation',
    'Package accepted by customer',
    'Delivery proof captured',
  ],
  FAILED: [
    'Customer not reachable',
    'Customer did not answer',
    'Wrong address',
    'Address not serviceable',
    'Customer unavailable',
    'Customer requested reschedule',
    'Customer refused order',
    'OTP not shared',
    'COD payment unavailable',
    'UPI payment failed',
    'Entry denied by security',
    'Address not found',
    'Vehicle breakdown',
    'Weather issue',
    'Package damaged',
    'Order cancelled',
  ],
};

export const transitionOptions = [
  { value: 'ACCEPTED', label: 'Accept Task' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out For Delivery' },
  { value: 'ARRIVED', label: 'Arrived At Location' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'FAILED', label: 'Failed Delivery' },
];
