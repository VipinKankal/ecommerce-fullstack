import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Divider,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import {
  sellerSettlementLedger,
  sellerSettlements,
} from 'State/backend/MasterApiThunks';
import Transaction from './Transaction';
import {
  PaymentFooterCards,
  PaymentLedgerTable,
  PaymentOverviewCard,
  PaymentSettlementTable,
  PaymentSummaryCards,
} from './PaymentSections';
import { SellerLedgerRow, SellerSettlementRow } from './Payment.support';

const Payment = () => {
  const dispatch = useAppDispatch();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const rawSettlements = responses.sellerSettlements;
  const rawLedger = responses.sellerSettlementLedger;

  useEffect(() => {
    dispatch(sellerSettlements());
    dispatch(sellerSettlementLedger());
  }, [dispatch]);

  const settlements = useMemo(
    () =>
      Array.isArray(rawSettlements)
        ? (rawSettlements as SellerSettlementRow[])
        : [],
    [rawSettlements],
  );

  const ledgerEntries = useMemo(
    () => (Array.isArray(rawLedger) ? (rawLedger as SellerLedgerRow[]) : []),
    [rawLedger],
  );

  const stats = useMemo(() => {
    const totalGross = settlements.reduce(
      (sum, row) => sum + Number(row.grossCollectedAmount || 0),
      0,
    );
    const totalNetPayable = settlements.reduce(
      (sum, row) => sum + Number(row.sellerPayableAmount || 0),
      0,
    );
    const totalDeductions = settlements.reduce(
      (sum, row) =>
        sum +
        Number(row.commissionAmount || 0) +
        Number(row.commissionGstAmount || 0) +
        Number(row.tcsAmount || 0),
      0,
    );
    const totalSellerGst = settlements.reduce(
      (sum, row) => sum + Number(row.sellerGstLiabilityAmount || 0),
      0,
    );
    const latest = settlements[0] || null;

    return {
      totalOrders: settlements.length,
      totalGross,
      totalNetPayable,
      totalDeductions,
      totalSellerGst,
      latestDate: latest?.createdAt || null,
    };
  }, [settlements]);

  return (
    <Box sx={{ p: { xs: 2, lg: 3 } }} className="space-y-5">
      <PaymentSummaryCards
        totalGross={stats.totalGross}
        totalNetPayable={stats.totalNetPayable}
        totalDeductions={stats.totalDeductions}
        totalSellerGst={stats.totalSellerGst}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <PaymentOverviewCard
        latestDate={stats.latestDate}
        totalOrders={stats.totalOrders}
        ledgerCount={ledgerEntries.length}
      />

      <PaymentSettlementTable settlements={settlements} loading={loading} />

      <PaymentLedgerTable ledgerEntries={ledgerEntries} loading={loading} />

      {loading && !settlements.length && !ledgerEntries.length && (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      )}

      <PaymentFooterCards />

      <Divider />

      <div>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Transaction History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Settlement rows above show payout math. The table below keeps raw
          customer-linked transaction history visible for operations.
        </Typography>
      </div>

      <Card
        sx={{
          p: 0,
          borderRadius: 4,
          boxShadow: 'none',
          border: '1px solid #eef2f7',
        }}
      >
        <Transaction />
      </Card>
    </Box>
  );
};

export default Payment;
