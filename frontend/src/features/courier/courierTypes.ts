export type DeliveryTaskStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED'
  | 'CONFIRMATION_PENDING'
  | 'DELIVERED'
  | 'FAILED';

export type ShipmentStatus =
  | 'LABEL_CREATED'
  | 'HANDED_TO_COURIER'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_EXCEPTION'
  | 'DELIVERY_FAILED';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORISED'
  | 'PAID'
  | 'FAILED'
  | 'COD_DUE'
  | 'COD_COLLECTED'
  | 'COD_DEPOSIT_PENDING'
  | 'COD_DEPOSITED'
  | 'COD_VERIFIED'
  | 'COD_DISPUTED';

export type CodCollectionMode = 'CASH' | 'UPI';
export type DepositMode = 'CASH' | 'UPI' | 'BANK_TRANSFER';
export type PetrolAllowanceType = 'FIXED' | 'CLAIM';
export type CourierTaskFlow = 'DELIVERY' | 'RETURN';
export type ReturnTaskStatus =
  | 'RETURN_REQUESTED'
  | 'RETURN_ASSIGNED'
  | 'RETURN_ACCEPTED'
  | 'RETURN_PICKED_UP'
  | 'RETURN_IN_TRANSIT'
  | 'RETURN_DELIVERED'
  | 'RETURN_FAILED';

export interface CourierProfile {
  id: number | string;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  zone?: string;
  status: string;
  kycStatus?: string;
  joiningDate?: string;
  activeOrders?: number;
  deliveriesThisMonth?: number;
  codSettlementFrequency?: string;
}

export interface CourierSalaryConfig {
  monthlyBase: number;
  perDeliveryRate: number;
  petrolAllowanceMonthlyCap: number;
  targetDeliveries: number;
  incentiveAmount: number;
  latePenalty: number;
  failedPenalty: number;
  codMismatchPenalty: number;
  attendanceBasisDays: number;
  petrolAllowanceType: PetrolAllowanceType;
}

export interface CourierAssignmentItem {
  id: number | string;
  orderId: number | string;
  shipmentId?: number | string;
  returnId?: number | string;
  customerName: string;
  customerPhone?: string;
  address: string;
  city?: string;
  paymentType: 'COD' | 'PAID' | 'ONLINE';
  paymentStatus: PaymentStatus;
  amount: number;
  codAmount?: number;
  deliveryWindow?: string;
  courierName?: string;
  courierPhone?: string;
  courierTaskStatus: DeliveryTaskStatus;
  shipmentStatus: ShipmentStatus;
  requiresOtp: boolean;
  etaLabel?: string;
  otpVerified?: boolean;
  proofPhotoUrl?: string;
  failureReason?: string;
  statusReason?: string;
  statusNote?: string;
  taskFlow?: CourierTaskFlow;
  reverseType?: 'RETURN' | 'EXCHANGE';
  reverseTaskId?: number | string;
  reversePickupTaskStatus?: string;
  reverseScheduledAt?: string;
  reversePickedAt?: string;
  returnStatus?: ReturnTaskStatus | string;
  returnReason?: string;
  itemTitle?: string;
}

export interface CodCollectionItem {
  id: number | string;
  orderId: number | string;
  courierId?: number | string;
  courierName?: string;
  amount: number;
  paymentMode: CodCollectionMode;
  collectedAt?: string;
  status: string;
  depositDate?: string;
  transactionId?: string;
}

export interface PetrolClaimItem {
  id: number | string;
  courierId?: number | string;
  courierName?: string;
  month: string;
  amount: number;
  status: string;
  receiptUrl?: string;
  notes?: string;
}

export interface EarningsBreakdown {
  month: string;
  baseSalary: number;
  presentDays: number;
  payableDays: number;
  perDeliveryRate: number;
  deliveriesCount: number;
  perDeliveryEarnings: number;
  petrolAllowanceApproved: number;
  incentiveAmount: number;
  penalties: number;
  totalPayable: number;
  codCollected?: number;
  codDeposited?: number;
  codPending?: number;
  payoutStatus?: string;
}

export interface DispatchQueueItem {
  id: number | string;
  orderId: number | string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city: string;
  zone?: string;
  paymentType: 'COD' | 'PAID' | 'ONLINE';
  paymentStatus?: PaymentStatus | string;
  codAmount?: number;
  deliveryWindow?: string;
  shipmentStatus: ShipmentStatus;
  courierId?: number | string;
  courierName?: string;
  slaRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TrackingMilestone {
  key: string;
  label: string;
  completed: boolean;
  active: boolean;
}
