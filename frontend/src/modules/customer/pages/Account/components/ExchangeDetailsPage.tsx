import React from "react";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import ExchangePriceSummary from "./ExchangePriceSummary";

type ExchangeRequestRecord = any;

type Props = {
  request: ExchangeRequestRecord;
  onPayDifference?: () => void;
  onSelectBalanceMode?: () => void;
  onSubmitBankDetails?: () => void;
};

const label = (value?: string | null) => (value || "-").replaceAll("_", " ");
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";

const ExchangeDetailsPage = ({ request, onPayDifference, onSelectBalanceMode, onSubmitBankDetails }: Props) => (
  <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 space-y-4">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-sky-700">Exchange Details</div>
        <div className="text-sm font-semibold text-slate-900 mt-1">Request No: {request.requestNumber || request.id}</div>
      </div>
      <Chip label={label(request.status)} color="info" sx={{ borderRadius: "999px", fontWeight: 700 }} />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Old Order</Typography>
        <div className="text-sm text-slate-600 mt-2 space-y-1">
          <div>Order #{request.oldOrderId}</div>
          <div>Product: {request.oldProductTitle || "-"}</div>
          <div>Price: Rs {Number(request.oldPrice || 0).toLocaleString("en-IN")}</div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Replacement Order</Typography>
        <div className="text-sm text-slate-600 mt-2 space-y-1">
          <div>{request.replacementOrder?.replacementOrderNumber || "Not created yet"}</div>
          <div>Product: {request.newProductTitle || "-"}</div>
          <div>Price: Rs {Number(request.newPrice || 0).toLocaleString("en-IN")}</div>
          <div>Status: {label(request.replacementOrder?.status)}</div>
        </div>
      </div>
    </div>

    <ExchangePriceSummary oldPrice={request.oldPrice} newPrice={request.newPrice} priceDifference={request.priceDifference} status={request.status} />

    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Balance Handling</Typography>
      <div className="text-sm text-slate-600">Mode: {label(request.priceSummary?.balanceMode)}</div>
      <div className="text-sm text-slate-600">Payment Reference: {request.balanceHandling?.paymentReference || "-"}</div>
      <div className="text-sm text-slate-600">Wallet Credit: {label(request.balanceHandling?.walletCreditStatus)}</div>
      <div className="text-sm text-slate-600">Bank Refund: {label(request.balanceHandling?.bankRefundStatus)}</div>
    </div>

    {request.status === "PAYMENT_PENDING_FOR_DIFFERENCE" && onPayDifference && <Alert severity="warning" action={<Button color="inherit" size="small" onClick={onPayDifference}>Pay Now</Button>}>Customer payment is pending for price difference.</Alert>}
    {request.status === "BALANCE_SELECTION_PENDING" && onSelectBalanceMode && <Alert severity="info" action={<Button color="inherit" size="small" onClick={onSelectBalanceMode}>Choose</Button>}>Choose how the remaining balance should be handled.</Alert>}
    {request.status === "BANK_DETAILS_PENDING" && onSubmitBankDetails && <Alert severity="info" action={<Button color="inherit" size="small" onClick={onSubmitBankDetails}>Add Bank</Button>}>Bank details are required before processing the balance refund.</Alert>}

    {!!request.history?.length && (
      <Stack spacing={1.25}>
        {request.history.map((entry: any, index: number) => (
          <div key={`${entry.status || 'status'}-${entry.createdAt || index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="font-semibold text-slate-900 text-sm">{label(entry.status)}</div>
              <div className="text-xs text-slate-500">{date(entry.createdAt)}</div>
            </div>
            {entry.note && <div className="mt-2 text-sm text-slate-600">{entry.note}</div>}
          </div>
        ))}
      </Stack>
    )}
  </div>
);

export default ExchangeDetailsPage;
