import { api } from "shared/api/Api";
import { API_ROUTES } from "shared/api/ApiRoutes";
import {
  CodCollectionItem,
  CourierAssignmentItem,
  CourierProfile,
  CourierSalaryConfig,
  DispatchQueueItem,
  EarningsBreakdown,
  PaymentStatus,
  PetrolClaimItem,
  TrackingMilestone,
} from "./courierTypes";

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const titleCase = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const inferReverseType = (item: any) => {
  const explicitType = (
    item?.requestType ||
    item?.returnRequestType ||
    item?.reverseType ||
    item?.returnType ||
    ""
  )
    .toString()
    .toUpperCase();

  if (explicitType.includes("EXCHANGE")) return "EXCHANGE" as const;
  if (explicitType.includes("RETURN")) return "RETURN" as const;

  const status = (
    item?.returnStatus ||
    item?.returnTaskStatus ||
    item?.reverseShipmentStatus ||
    item?.reversePickupStatus ||
    ""
  )
    .toString()
    .toUpperCase();

  if (status.startsWith("EXCHANGE") || status.startsWith("OLD_PRODUCT") || status.startsWith("REPLACEMENT")) {
    return "EXCHANGE" as const;
  }

  return "RETURN" as const;
};
const inferTaskFlow = (item: any) => {
  const rawFlow = (
    item?.taskFlow ||
    item?.flowType ||
    item?.assignmentType ||
    item?.taskType ||
    item?.returnType ||
    ""
  )
    .toString()
    .toUpperCase();

  if (rawFlow.includes("RETURN")) return "RETURN" as const;
  if (
    item?.returnId ||
    item?.returnRequestId ||
    item?.returnStatus ||
    item?.returnReason ||
    item?.returnOrder ||
    item?.isReturn
  ) {
    return "RETURN" as const;
  }

  return "DELIVERY" as const;
};

export const defaultSalaryConfig: CourierSalaryConfig = {
  monthlyBase: 8000,
  perDeliveryRate: 20,
  petrolAllowanceMonthlyCap: 1500,
  targetDeliveries: 220,
  incentiveAmount: 1500,
  latePenalty: 50,
  failedPenalty: 30,
  codMismatchPenalty: 100,
  attendanceBasisDays: 30,
  petrolAllowanceType: "FIXED",
};

export const mapCourier = (item: any): CourierProfile => ({
  id: item?.id ?? item?.courierId ?? Math.random(),
  fullName: item?.fullName || item?.name || "Courier",
  phone: item?.phone || item?.mobile || "-",
  email: item?.email || "",
  city: item?.city || item?.address?.city || "-",
  zone: item?.zone || item?.zoneName || "Unassigned",
  status: (item?.status || "INACTIVE").toUpperCase(),
  kycStatus: (item?.kycStatus || item?.verificationStatus || "PENDING").toUpperCase(),
  joiningDate: item?.joiningDate || item?.createdAt,
  activeOrders: toNumber(item?.activeOrders ?? item?.assignedOrders),
  deliveriesThisMonth: toNumber(item?.deliveriesThisMonth ?? item?.deliveries),
  codSettlementFrequency: (item?.codSettlementFrequency || "DAILY").toUpperCase(),
});

export const mapAssignment = (item: any): CourierAssignmentItem => {
  const taskFlow = inferTaskFlow(item);
  const rawTaskStatus = (item?.courierTaskStatus || item?.status || "ASSIGNED").toUpperCase();
  const normalizedTaskStatus =
    rawTaskStatus === "PICKED" ? "PICKED_UP" : rawTaskStatus === "ARRIVED_AT_LOCATION" ? "ARRIVED" : rawTaskStatus;
  const rawShipmentStatus = (item?.shipmentStatus || item?.status || "LABEL_CREATED").toUpperCase();
  const paymentType = (item?.paymentType || item?.paymentMethod || (item?.codAmount ? "COD" : "PAID")).toUpperCase();
  const rawReturnStatus = (
    item?.returnStatus ||
    item?.returnTaskStatus ||
    item?.reverseShipmentStatus ||
    item?.reversePickupStatus ||
    (taskFlow === "RETURN" ? normalizedTaskStatus : "")
  ).toUpperCase();
  const reverseType = taskFlow === "RETURN" ? inferReverseType(item) : undefined;

  return {
    id: item?.id ?? item?.assignmentId ?? item?.taskId ?? item?.orderId,
    orderId: item?.orderId ?? item?.id,
    shipmentId: item?.shipmentId,
    returnId: item?.returnId ?? item?.returnRequestId,
    customerName: item?.customerName || item?.customer?.fullName || "Customer",
    customerPhone: item?.customerPhone || item?.customer?.phone || "",
    address: item?.address || item?.deliveryAddress || item?.shippingAddress || item?.city || "Address unavailable",
    city: item?.city || item?.shippingAddress?.city || "",
    paymentType: paymentType === "COD" ? "COD" : paymentType === "PAID" ? "PAID" : "ONLINE",
    paymentStatus: ((item?.paymentStatus || (paymentType === "COD" ? "COD_DUE" : "PAID")) as PaymentStatus),
    amount: toNumber(item?.amount ?? item?.orderAmount ?? item?.grandTotal),
    codAmount: toNumber(item?.codAmount ?? item?.amountDue),
    deliveryWindow: item?.deliveryWindow || item?.deliverySlot || item?.expectedDelivery,
    courierName: item?.courierName || item?.courier?.fullName,
    courierPhone: item?.courierPhone || item?.courier?.phone,
    courierTaskStatus: normalizedTaskStatus as CourierAssignmentItem["courierTaskStatus"],
    shipmentStatus: rawShipmentStatus as CourierAssignmentItem["shipmentStatus"],
    requiresOtp: Boolean(item?.requiresOtp ?? true),
    etaLabel: item?.etaLabel || item?.expectedDelivery || item?.deliveryWindow,
    otpVerified: Boolean(item?.otpVerified),
    proofPhotoUrl: item?.proofPhotoUrl || item?.deliveryPhotoUrl,
    failureReason: item?.failureReason,
    statusReason: item?.statusReason,
    statusNote: item?.statusNote,
    taskFlow,
    reverseType,
    reverseTaskId: item?.reverseTaskId ?? item?.reversePickupTaskId ?? item?.taskId,
    reversePickupTaskStatus: item?.reversePickupTaskStatus ?? item?.pickupStatus ?? undefined,
    reverseScheduledAt: item?.reverseScheduledAt ?? item?.scheduledAt ?? undefined,
    reversePickedAt: item?.reversePickedAt ?? item?.pickedAt ?? undefined,
    returnStatus: rawReturnStatus || undefined,
    returnReason: item?.returnReason || item?.reason || item?.returnPickupReason,
    itemTitle: item?.itemTitle || item?.productTitle || item?.product?.title,
  };
};

export const mapCodCollection = (item: any): CodCollectionItem => ({
  id: item?.id ?? item?.collectionId ?? Math.random(),
  orderId: item?.orderId ?? item?.order?.id ?? "-",
  courierId: item?.courierId ?? item?.courier?.id,
  courierName: item?.courierName || item?.courier?.fullName,
  amount: toNumber(item?.amount ?? item?.codAmount ?? item?.amountCollected),
  paymentMode: (item?.paymentMode || item?.mode || "CASH").toUpperCase(),
  collectedAt: item?.collectedAt || item?.createdAt,
  status: (item?.status || "PENDING_DEPOSIT").toUpperCase(),
  depositDate: item?.depositDate || item?.settlementDate,
  transactionId: item?.transactionId || item?.referenceId,
});

export const mapPetrolClaim = (item: any): PetrolClaimItem => ({
  id: item?.id ?? item?.claimId ?? Math.random(),
  courierId: item?.courierId ?? item?.courier?.id,
  courierName: item?.courierName || item?.courier?.fullName,
  month: item?.month || item?.claimMonth || "",
  amount: toNumber(item?.amount),
  status: (item?.status || "PENDING").toUpperCase(),
  receiptUrl: item?.receiptUrl,
  notes: item?.notes || item?.reviewerNote,
});

export const mapEarnings = (item: any, month: string): EarningsBreakdown => ({
  month,
  baseSalary: toNumber(item?.baseSalary ?? item?.monthlyBase ?? defaultSalaryConfig.monthlyBase),
  presentDays: toNumber(item?.presentDays ?? item?.attendanceDays ?? defaultSalaryConfig.attendanceBasisDays),
  payableDays: toNumber(item?.payableDays ?? item?.attendanceBasisDays ?? defaultSalaryConfig.attendanceBasisDays),
  perDeliveryRate: toNumber(item?.perDeliveryRate ?? defaultSalaryConfig.perDeliveryRate),
  deliveriesCount: toNumber(item?.deliveriesCount ?? item?.deliveryCount),
  perDeliveryEarnings: toNumber(item?.perDeliveryEarnings),
  petrolAllowanceApproved: toNumber(item?.petrolAllowanceApproved ?? item?.petrolAllowance ?? item?.petrolApproved),
  incentiveAmount: toNumber(item?.incentiveAmount ?? item?.incentives),
  penalties: toNumber(item?.penalties ?? item?.penaltyAmount),
  totalPayable: toNumber(item?.totalPayable ?? item?.finalPayout),
  codCollected: toNumber(item?.codCollected),
  codDeposited: toNumber(item?.codDeposited),
  codPending: toNumber(item?.codPending),
  payoutStatus: item?.payoutStatus || item?.status || "DRAFT",
});

export const mapDispatchItem = (item: any): DispatchQueueItem => ({
  id: item?.id ?? item?.shipmentId ?? item?.orderId,
  orderId: item?.orderId ?? item?.id,
  customerName: item?.customerName || item?.customer?.fullName || item?.customer?.name || "",
  customerPhone: item?.customerPhone || item?.customer?.phone || "",
  address: item?.address || item?.shippingAddress?.address || item?.shippingAddress?.street || "",
  city: item?.city || item?.shippingAddress?.city || "-",
  zone: item?.zone || item?.zoneName || "-",
  paymentType: (item?.paymentType || item?.paymentMethod || (item?.codAmount ? "COD" : "PAID")).toUpperCase(),
  paymentStatus: item?.paymentStatus || "",
  codAmount: toNumber(item?.codAmount),
  deliveryWindow: item?.deliveryWindow || item?.deliverySlot || item?.expectedDelivery,
  shipmentStatus: (item?.shipmentStatus || "LABEL_CREATED").toUpperCase(),
  courierId: item?.courierId,
  courierName: item?.courierName,
  slaRisk: (item?.slaRisk || "LOW").toUpperCase(),
});

export const buildTrackingMilestones = (source: {
  orderStatus?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
  deliveryTaskStatus?: string;
}): TrackingMilestone[] => {
  const normalizedFulfillment = (source.fulfillmentStatus || "").toUpperCase();
  const normalizedShipment = (source.shipmentStatus || "").toUpperCase();
  const normalizedDeliveryTask = (source.deliveryTaskStatus || "").toUpperCase();
  const normalizedOrder = (source.orderStatus || "").toUpperCase();
  const orderPlaced = Boolean(source.orderStatus);
  const packed = ["FULFILLED", "PACKED"].includes(normalizedFulfillment)
    || ["HANDED_TO_COURIER", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(normalizedShipment)
    || ["PICKED_UP", "OUT_FOR_DELIVERY", "ARRIVED", "CONFIRMATION_PENDING", "DELIVERED"].includes(normalizedDeliveryTask);
  const shipped = ["HANDED_TO_COURIER", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(normalizedShipment)
    || ["OUT_FOR_DELIVERY", "ARRIVED", "CONFIRMATION_PENDING", "DELIVERED"].includes(normalizedDeliveryTask);
  const outForDelivery = normalizedShipment === "OUT_FOR_DELIVERY"
    || ["ARRIVED", "CONFIRMATION_PENDING", "DELIVERED"].includes(normalizedDeliveryTask)
    || normalizedShipment === "DELIVERED";
  const delivered = normalizedShipment === "DELIVERED"
    || normalizedDeliveryTask === "DELIVERED"
    || normalizedOrder === "DELIVERED"
    || normalizedOrder === "COMPLETED";

  return [
    { key: "PLACED", label: "Order Placed", completed: orderPlaced, active: orderPlaced && !packed },
    { key: "PACKED", label: "Packed", completed: packed, active: packed && !shipped },
    { key: "SHIPPED", label: "Shipped", completed: shipped, active: shipped && !outForDelivery },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", completed: outForDelivery, active: outForDelivery && !delivered },
    { key: "DELIVERED", label: "Delivered", completed: delivered, active: delivered },
  ];
};

export const formatMoney = (amount?: number) => `Rs ${toNumber(amount).toLocaleString("en-IN")}`;
export const formatDateLabel = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export const statusTone = (value?: string) => {
  const status = (value || "").toUpperCase();
  if (["DELIVERED", "PAID", "VERIFIED", "APPROVED", "ACTIVE", "RETURN_DELIVERED", "REFUND_COMPLETED", "EXCHANGE_COMPLETED", "REPLACEMENT_DELIVERED"].includes(status)) return "success" as const;
  if (["FAILED", "REJECTED", "CANCELLED", "DISPUTED", "DELIVERY_FAILED", "INACTIVE", "RETURN_FAILED", "RETURN_REJECTED", "EXCHANGE_REJECTED"].includes(status)) return "error" as const;
  if (["OUT_FOR_DELIVERY", "IN_TRANSIT", "IN_PROGRESS", "ARRIVED", "PICKED_UP", "RETURN_PICKED_UP", "RETURN_IN_TRANSIT", "RETURN_ACCEPTED", "RETURN_PICKED", "OLD_PRODUCT_PICKED", "INSPECTION", "REFUND_INITIATED", "REPLACEMENT_ORDER_CREATED", "REPLACEMENT_SHIPPED", "ACCEPTED"].includes(status)) return "info" as const;
  if (["CONFIRMATION_PENDING", "PLACED", "LABEL_CREATED", "HANDED_TO_COURIER", "COD_DUE", "RETURN_REQUESTED", "RETURN_ASSIGNED", "RETURN_MORE_INFO_REQUESTED", "EXCHANGE_REQUESTED", "EXCHANGE_MORE_INFO_REQUESTED", "RETURN_PICKUP_SCHEDULED", "EXCHANGE_PICKUP_SCHEDULED"].includes(status)) return "warning" as const;
  return "warning" as const;
};

export const deriveCourierOverview = (assignments: CourierAssignmentItem[], codItems: CodCollectionItem[]) => ({
  ordersToday: assignments.filter((item) => item.taskFlow !== "RETURN").length,
  deliveredToday: assignments.filter((item) => item.taskFlow !== "RETURN" && item.courierTaskStatus === "DELIVERED").length,
  failedToday: assignments.filter((item) => item.taskFlow !== "RETURN" && item.courierTaskStatus === "FAILED").length,
  codCollected: codItems.reduce((sum, item) => sum + toNumber(item.amount), 0),
});

export const getPaymentBadgeLabel = (item: CourierAssignmentItem) => {
  if (item.taskFlow === "RETURN") {
    return item.returnStatus ? titleCase(item.returnStatus) : "Return";
  }
  if (item.paymentType === "COD") {
    return `COD ${formatMoney(item.codAmount || item.amount)}`;
  }
  return item.paymentStatus === "PAID" ? "Paid Online" : titleCase(item.paymentStatus);
};

export const loadAdminCouriers = async () => {
  const response = await api.get(API_ROUTES.adminCouriers.base);
  return toArray<any>(response.data).map(mapCourier);
};

export const loadCourierAssignments = async () => {
  const response = await api.get(API_ROUTES.courier.assignments);
  return toArray<any>(response.data).map(mapAssignment);
};

export const loadCourierEarnings = async (month: string) => {
  const response = await api.get(API_ROUTES.courier.earnings(month));
  return mapEarnings(response.data || {}, month);
};

export const loadAdminEarnings = async (courierId: number | string, month: string) => {
  const response = await api.get(API_ROUTES.adminCouriers.earnings(courierId, month));
  return mapEarnings(response.data || {}, month);
};
