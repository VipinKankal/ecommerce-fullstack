import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  adminSalesReport,
  adminSettlementLedger,
  adminSettlements,
} from 'State/backend/MasterApiThunks';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';
import {
  ComplianceChallan,
  ChallanFormState,
  LedgerAccountSummary,
} from './AdminReports.types';
import {
  downloadCsv,
  toChallans,
  toDatetimeLocalValue,
  toLedgerRows,
  toMonthValue,
  toSalesReport,
  toSettlements,
  money,
} from './AdminReports.utils';
import {
  AdminChallanPanel,
  AdminLedgerTable,
  AdminReportsLeaderboards,
  AdminReportsSummaryCards,
  AdminSettlementTable,
} from './AdminReportsSections';
import TaxRuleManagementPanel from './components/TaxRuleManagementPanel';
import HsnMasterManagementPanel from './components/HsnMasterManagementPanel';
import ProductTaxReviewQueuePanel from './components/ProductTaxReviewQueuePanel';

const AdminReports = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const [challans, setChallans] = useState<ComplianceChallan[]>([]);
  const [challanLoading, setChallanLoading] = useState(false);
  const [challanSubmitting, setChallanSubmitting] = useState(false);
  const [challanError, setChallanError] = useState<string | null>(null);
  const [challanSuccess, setChallanSuccess] = useState<string | null>(null);
  const [challanForm, setChallanForm] = useState<ChallanFormState>({
    taxStream: 'GST',
    filingPeriod: toMonthValue(),
    amount: '',
    challanReference: '',
    paymentStatus: 'PAID',
    paidAt: toDatetimeLocalValue(),
    notes: '',
  });

  const report = toSalesReport(responses.adminSalesReport);
  const settlements = toSettlements(responses.adminSettlements);
  const ledgerRows = toLedgerRows(responses.adminSettlementLedger);
  const topCategories = report?.topCategories ?? [];
  const topSellers = report?.topSellers ?? [];

  const loadChallans = async () => {
    setChallanLoading(true);
    setChallanError(null);
    try {
      const response = await api.get(API_ROUTES.admin.complianceChallans);
      setChallans(toChallans(response.data));
    } catch (requestError: unknown) {
      setChallanError(
        getErrorMessage(requestError, 'Failed to load compliance challans'),
      );
    } finally {
      setChallanLoading(false);
    }
  };

  useEffect(() => {
    dispatch(adminSalesReport());
    dispatch(adminSettlements());
    dispatch(adminSettlementLedger());
    loadChallans();
  }, [dispatch]);

  const compliance = useMemo(() => {
    const totalCommissionGst = settlements.reduce(
      (sum, row) => sum + Number(row.commissionGstAmount || 0),
      0,
    );
    const totalTcs = settlements.reduce(
      (sum, row) => sum + Number(row.tcsAmount || 0),
      0,
    );
    const totalAdminGst = settlements.reduce(
      (sum, row) => sum + Number(row.adminGstLiabilityAmount || 0),
      0,
    );
    const totalSellerGstMemo = settlements.reduce(
      (sum, row) => sum + Number(row.sellerGstLiabilityAmount || 0),
      0,
    );
    const payoutReserve = settlements.reduce(
      (sum, row) => sum + Number(row.sellerPayableAmount || 0),
      0,
    );
    const grossCollections = settlements.reduce(
      (sum, row) => sum + Number(row.grossCollectedAmount || 0),
      0,
    );
    const readyForPayout = settlements.filter(
      (row) => row.settlementStatus === 'READY_FOR_PAYOUT',
    ).length;
    const retained = settlements.filter(
      (row) => row.settlementStatus === 'RETAINED',
    ).length;
    const challanPaid = challans.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    );

    return {
      totalCommissionGst,
      totalTcs,
      totalAdminGst,
      totalSellerGstMemo,
      payoutReserve,
      grossCollections,
      readyForPayout,
      retained,
      challanPaid,
    };
  }, [challans, settlements]);

  const ledgerAccounts = useMemo(() => {
    const summary = new Map<string, LedgerAccountSummary>();

    ledgerRows.forEach((row) => {
      const accountCode = String(row.accountCode || 'UNKNOWN');
      const current = summary.get(accountCode) || {
        accountCode,
        accountName: String(row.accountName || 'Unknown Account'),
        credits: 0,
        debits: 0,
        memos: 0,
        entries: 0,
      };
      const amount = Number(row.amount || 0);
      const direction = String(row.entryDirection || '').toUpperCase();

      current.entries += 1;
      if (direction === 'CREDIT') {
        current.credits += amount;
      } else if (direction === 'DEBIT') {
        current.debits += amount;
      } else {
        current.memos += amount;
      }

      summary.set(accountCode, current);
    });

    return Array.from(summary.values()).sort(
      (left, right) =>
        right.credits + right.debits - (left.credits + left.debits),
    );
  }, [ledgerRows]);

  const submitChallan = async () => {
    setChallanSubmitting(true);
    setChallanError(null);
    setChallanSuccess(null);
    try {
      await api.post(API_ROUTES.admin.complianceChallans, {
        taxStream: challanForm.taxStream,
        filingPeriod: challanForm.filingPeriod,
        amount: Number(challanForm.amount || 0),
        challanReference: challanForm.challanReference,
        paymentStatus: challanForm.paymentStatus,
        paidAt: challanForm.paidAt
          ? new Date(challanForm.paidAt).toISOString()
          : undefined,
        notes: challanForm.notes || undefined,
      });
      setChallanSuccess('Compliance challan saved successfully.');
      setChallanForm({
        taxStream: 'GST',
        filingPeriod: toMonthValue(),
        amount: '',
        challanReference: '',
        paymentStatus: 'PAID',
        paidAt: toDatetimeLocalValue(),
        notes: '',
      });
      await loadChallans();
    } catch (requestError: unknown) {
      setChallanError(
        getErrorMessage(requestError, 'Failed to save compliance challan'),
      );
    } finally {
      setChallanSubmitting(false);
    }
  };

  const exportSettlements = () => {
    const rows = [
      [
        'Order ID',
        'Type',
        'Status',
        'Gross',
        'Commission GST',
        'TCS',
        'Admin GST',
        'Seller GST Memo',
        'Created At',
      ],
      ...settlements.map((row) => [
        String(row.orderId || ''),
        row.orderType || '',
        row.settlementStatus || '',
        String(row.grossCollectedAmount || 0),
        String(row.commissionGstAmount || 0),
        String(row.tcsAmount || 0),
        String(row.adminGstLiabilityAmount || 0),
        String(row.sellerGstLiabilityAmount || 0),
        row.createdAt || '',
      ]),
    ];
    downloadCsv('gst-tcs-settlements.csv', rows);
  };

  const exportLedger = () => {
    const rows = [
      ['Account Code', 'Account Name', 'Direction', 'Amount'],
      ...ledgerRows.map((row) => [
        String(row.accountCode || ''),
        String(row.accountName || ''),
        String(row.entryDirection || ''),
        String(row.amount || 0),
      ]),
    ];
    downloadCsv('gst-tcs-ledger.csv', rows);
  };

  const exportChallans = () => {
    const rows = [
      [
        'Tax Stream',
        'Filing Period',
        'Amount',
        'Reference',
        'Status',
        'Paid At',
        'Notes',
      ],
      ...challans.map((row) => [
        String(row.taxStream || ''),
        String(row.filingPeriod || ''),
        String(row.amount || 0),
        String(row.challanReference || ''),
        String(row.paymentStatus || ''),
        String(row.paidAt || ''),
        String(row.notes || ''),
      ]),
    ];
    downloadCsv('gst-tcs-challans.csv', rows);
  };

  if (loading && !report && settlements.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Sales And Compliance Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Platform sales summary plus GST/TCS month-close visibility from live
            settlement, ledger, and challan data.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            onClick={exportSettlements}
            disabled={settlements.length === 0}
          >
            Export Settlements
          </Button>
          <Button
            variant="outlined"
            onClick={exportLedger}
            disabled={ledgerRows.length === 0}
          >
            Export Ledger
          </Button>
          <Button
            variant="outlined"
            onClick={exportChallans}
            disabled={challans.length === 0}
          >
            Export Challans
          </Button>
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}
      {challanError && <Alert severity="error">{challanError}</Alert>}
      {challanSuccess && (
        <Alert severity="success" onClose={() => setChallanSuccess(null)}>
          {challanSuccess}
        </Alert>
      )}

      <AdminReportsSummaryCards
        reportCards={[
          { title: 'Revenue', value: money(report?.totalRevenue), tone: 'Sales' },
          { title: 'Orders', value: report?.totalOrders || 0, tone: 'Sales' },
          { title: 'Delivered', value: report?.deliveredOrders || 0, tone: 'Sales' },
          { title: 'Cancelled', value: report?.cancelledOrders || 0, tone: 'Sales' },
          { title: 'Transactions', value: report?.totalTransactions || 0, tone: 'Sales' },
        ]}
        complianceCards={[
          {
            title: 'Admin GST Payable',
            value: money(compliance.totalAdminGst),
            subtitle: 'Commission GST + retained GST + TCS stream',
          },
          {
            title: 'TCS Payable',
            value: money(compliance.totalTcs),
            subtitle: 'GSTR-8 dataset basis',
          },
          {
            title: 'Commission GST',
            value: money(compliance.totalCommissionGst),
            subtitle: 'Marketplace service tax',
          },
          {
            title: 'Seller GST Memo',
            value: money(compliance.totalSellerGstMemo),
            subtitle: 'Seller-side visibility only',
          },
          {
            title: 'Payout Reserve',
            value: money(compliance.payoutReserve),
            subtitle: `${compliance.readyForPayout} ready / ${compliance.retained} retained`,
          },
          {
            title: 'Challan Recorded',
            value: money(compliance.challanPaid),
            subtitle: `${challans.length} payment records saved`,
          },
        ]}
      />

      <AdminReportsLeaderboards
        topCategories={topCategories}
        topSellers={topSellers}
      />

      <AdminSettlementTable settlements={settlements} compliance={compliance} />

      <AdminLedgerTable ledgerAccounts={ledgerAccounts} />

      <AdminChallanPanel
        challanForm={challanForm}
        setChallanForm={setChallanForm}
        challans={challans}
        challanLoading={challanLoading}
        challanSubmitting={challanSubmitting}
        onSubmit={submitChallan}
        onRefresh={loadChallans}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TaxRuleManagementPanel />
        <HsnMasterManagementPanel />
      </div>

      <ProductTaxReviewQueuePanel />
    </div>
  );
};

export default AdminReports;




