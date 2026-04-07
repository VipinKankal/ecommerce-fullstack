export type LeaderboardItem = {
  label: string;
  value: number;
};

export type AdminSalesReportResponse = {
  totalRevenue?: number;
  totalOrders?: number;
  deliveredOrders?: number;
  cancelledOrders?: number;
  totalTransactions?: number;
  topCategories: LeaderboardItem[];
  topSellers: LeaderboardItem[];
};

export type SettlementRow = {
  id?: number | string;
  orderId?: number | string;
  orderType?: string;
  settlementStatus?: string;
  grossCollectedAmount?: number | string;
  commissionGstAmount?: number | string;
  tcsAmount?: number | string;
  sellerPayableAmount?: number | string;
  sellerGstLiabilityAmount?: number | string;
  adminGstLiabilityAmount?: number | string;
  createdAt?: string;
};

export type LedgerRow = {
  id?: number | string;
  accountCode?: string;
  accountName?: string;
  entryDirection?: string;
  amount?: number | string;
};

export type ComplianceChallan = {
  id?: number | string;
  taxStream?: string;
  filingPeriod?: string;
  amount?: number | string;
  challanReference?: string;
  paymentStatus?: string;
  paidAt?: string;
  notes?: string;
  createdAt?: string;
};

export type LedgerAccountSummary = {
  accountCode: string;
  accountName: string;
  credits: number;
  debits: number;
  memos: number;
  entries: number;
};

export type ChallanFormState = {
  taxStream: string;
  filingPeriod: string;
  amount: string;
  challanReference: string;
  paymentStatus: string;
  paidAt: string;
  notes: string;
};

export type ComplianceSummary = {
  totalCommissionGst: number;
  totalTcs: number;
  totalAdminGst: number;
  totalSellerGstMemo: number;
  payoutReserve: number;
  grossCollections: number;
  readyForPayout: number;
  retained: number;
  challanPaid: number;
};
