import React from 'react';
import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  formatDateLabel,
  formatMoney,
  statusTone,
} from 'features/courier/courierData';
import {
  CodCollectionItem,
  CodCollectionMode,
} from 'features/courier/courierTypes';

type CodFormState = {
  amount: string;
  mode: CodCollectionMode;
  referenceId: string;
  settlementDate: string;
};

type CodSectionProps = {
  codForm: CodFormState;
  codItems: CodCollectionItem[];
  onSubmit: () => void | Promise<void>;
  setCodForm: React.Dispatch<React.SetStateAction<CodFormState>>;
};

const CourierCodSection = ({
  codForm,
  codItems,
  onSubmit,
  setCodForm,
}: CodSectionProps) => (
  <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        COD Collections
      </Typography>
      {codItems.map((item) => (
        <div
          key={String(item.id)}
          className="rounded-3xl border border-slate-200 p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-slate-900">
              Order #{item.orderId}
            </div>
            <Chip
              size="small"
              label={item.status}
              color={statusTone(item.status)}
            />
          </div>
          <div className="text-sm text-slate-500">
            Mode: {item.paymentMode} - Amount: {formatMoney(item.amount)}
          </div>
          <div className="text-sm text-slate-500">
            Collected: {formatDateLabel(item.collectedAt)}
          </div>
        </div>
      ))}
      {!codItems.length && (
        <Typography color="text.secondary">No COD collected yet.</Typography>
      )}
    </Paper>

    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Submit COD Deposit
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField
          size="small"
          label="Total Amount"
          value={codForm.amount}
          onChange={(event) =>
            setCodForm((current) => ({
              ...current,
              amount: event.target.value,
            }))
          }
        />
        <FormControl size="small" fullWidth>
          <InputLabel>Deposit Mode</InputLabel>
          <Select
            value={codForm.mode}
            label="Deposit Mode"
            onChange={(event) =>
              setCodForm((current) => ({
                ...current,
                mode: event.target.value as CodCollectionMode,
              }))
            }
          >
            <MenuItem value="CASH">Cash</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Reference Number"
          value={codForm.referenceId}
          onChange={(event) =>
            setCodForm((current) => ({
              ...current,
              referenceId: event.target.value,
            }))
          }
        />
        <TextField
          size="small"
          type="date"
          label="Deposit Date"
          value={codForm.settlementDate}
          onChange={(event) =>
            setCodForm((current) => ({
              ...current,
              settlementDate: event.target.value,
            }))
          }
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </div>
      <Button variant="contained" onClick={onSubmit}>
        Submit Deposit
      </Button>
    </Paper>
  </div>
);

export default CourierCodSection;
