export type DeliveryHistoryItem = {
  id?: number | string;
  status?: string;
  reason?: string;
  note?: string;
  proofUrl?: string;
  updatedBy?: string;
  updatedAt?: string;
};

export type PayrollRow = {
  id?: number | string;
  courierId?: number | string;
  courierName?: string;
  month?: string;
  baseSalary?: number;
  presentDays?: number;
  payableDays?: number;
  perDeliveryEarnings?: number;
  petrolAllowanceApproved?: number;
  incentiveAmount?: number;
  penalties?: number;
  totalPayable?: number;
  payoutStatus?: string;
  paidAt?: string;
  payoutReference?: string;
};

export type AdminOrderRow = {
  id: number | string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
  courierName?: string;
  courierPhone?: string;
  deliveryWindow?: string;
  totalSellingPrice?: number;
  orderDate?: string;
};

export type TabKey =
  | 'overview'
  | 'couriers'
  | 'orders'
  | 'dispatch'
  | 'cod'
  | 'payroll';

export type NewCourierForm = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  zone: string;
  vehicleNumber: string;
  kycIdNumber: string;
  kycDocUrl: string;
};

export type SalaryConfigForm = {
  monthlyBase: string;
  perDeliveryRate: string;
  petrolAllowanceMonthlyCap: string;
  targetDeliveries: string;
  incentiveAmount: string;
  latePenalty: string;
  failedPenalty: string;
  codMismatchPenalty: string;
};
