import type { ChipProps } from '@mui/material/Chip';

export type SellerSettlementRow = {
  id?: number | string;
  orderId?: number | string;
  paymentOrderId?: number | string;
  orderType?: string;
  settlementStatus?: string;
  grossCollectedAmount?: number | string;
  taxableValue?: number | string;
  gstAmount?: number | string;
  commissionAmount?: number | string;
  commissionGstAmount?: number | string;
  tcsRatePercentage?: number | string;
  tcsAmount?: number | string;
  sellerPayableAmount?: number | string;
  sellerGstLiabilityAmount?: number | string;
  currencyCode?: string;
  notes?: string;
  createdAt?: string;
};

export type SellerLedgerRow = {
  id?: number | string;
  orderId?: number | string;
  entryGroup?: string;
  entryDirection?: string;
  accountName?: string;
  amount?: number | string;
  currencyCode?: string;
  note?: string;
  createdAt?: string;
};

export const formatCurrency = (
  value: number | string | undefined,
  currencyCode?: string,
) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode || 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} ${date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}`;
};

export const getSettlementTone = (
  status?: string,
): { color: ChipProps['color']; label: string } => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'READY_FOR_PAYOUT') {
    return { color: 'success', label: 'READY FOR PAYOUT' };
  }
  if (normalized === 'RETAINED') {
    return { color: 'info', label: 'RETAINED' };
  }
  return { color: 'default', label: normalized || 'UNKNOWN' };
};

export const getLedgerTone = (
  direction?: string,
): { color: ChipProps['color']; label: string } => {
  const normalized = String(direction || '').toUpperCase();
  if (normalized === 'CREDIT') {
    return { color: 'success', label: 'CREDIT' };
  }
  if (normalized === 'DEBIT') {
    return { color: 'warning', label: 'DEBIT' };
  }
  return { color: 'default', label: normalized || 'MEMO' };
};
