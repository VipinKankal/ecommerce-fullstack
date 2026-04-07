import {
  AdminSalesReportResponse,
  ComplianceChallan,
  LedgerRow,
  LeaderboardItem,
  SettlementRow,
} from './AdminReports.types';

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' ? value : fallback;

const toLeaderboard = (value: unknown): LeaderboardItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const record = entry as Record<string, unknown>;
      if (typeof record.label !== 'string') {
        return null;
      }
      return {
        label: record.label,
        value: toNumber(record.value),
      };
    })
    .filter((entry): entry is LeaderboardItem => entry !== null);
};

export const toSalesReport = (payload: unknown): AdminSalesReportResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  return {
    totalRevenue: toNumber(record.totalRevenue),
    totalOrders: toNumber(record.totalOrders),
    deliveredOrders: toNumber(record.deliveredOrders),
    cancelledOrders: toNumber(record.cancelledOrders),
    totalTransactions: toNumber(record.totalTransactions),
    topCategories: toLeaderboard(record.topCategories),
    topSellers: toLeaderboard(record.topSellers),
  };
};

export const money = (value?: number | string | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const label = (value?: string | null) =>
  (value || '-').replaceAll('_', ' ');

export const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('en-IN') : '-';

export const toMonthValue = () => new Date().toISOString().slice(0, 7);

export const toDatetimeLocalValue = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export const toSettlements = (payload: unknown): SettlementRow[] =>
  Array.isArray(payload) ? (payload as SettlementRow[]) : [];

export const toLedgerRows = (payload: unknown): LedgerRow[] =>
  Array.isArray(payload) ? (payload as LedgerRow[]) : [];

export const toChallans = (payload: unknown): ComplianceChallan[] =>
  Array.isArray(payload) ? (payload as ComplianceChallan[]) : [];

export const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
