import React from "react";
import { Alert, Chip, Stack, Typography } from "@mui/material";

type Props = {
  oldPrice?: number | null;
  newPrice?: number | null;
  priceDifference?: number | null;
  status?: string;
};

const money = (value?: number | null) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
const label = (value?: string | null) => (value || "-").replaceAll("_", " ");

const ExchangePriceSummary = ({ oldPrice, newPrice, priceDifference, status }: Props) => {
  const diff = Number(priceDifference || 0);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Price Summary</Typography>
        <Chip label={label(status)} color="warning" />
      </div>
      <Stack spacing={1}>
        <Typography variant="body2"><strong>Old Product Price:</strong> {money(oldPrice)}</Typography>
        <Typography variant="body2"><strong>New Product Price:</strong> {money(newPrice)}</Typography>
        <Typography variant="body2"><strong>Price Difference:</strong> {money(Math.abs(diff))}</Typography>
      </Stack>
      {diff > 0 && <Alert severity="warning">Customer must pay {money(diff)} before exchange pickup is scheduled.</Alert>}
      {diff < 0 && <Alert severity="info">Customer will receive {money(Math.abs(diff))} as wallet credit or bank transfer.</Alert>}
      {diff === 0 && <Alert severity="success">No price difference. Exchange can proceed directly after approval.</Alert>}
    </div>
  );
};

export default ExchangePriceSummary;
