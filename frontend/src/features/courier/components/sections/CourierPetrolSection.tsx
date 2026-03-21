import React from 'react';
import { Button, Chip, Paper, TextField, Typography } from '@mui/material';
import {
  defaultSalaryConfig,
  formatMoney,
  statusTone,
} from 'features/courier/courierData';
import { PetrolClaimItem } from 'features/courier/courierTypes';

type PetrolFormState = {
  claimMonth: string;
  amount: string;
  receiptUrl: string;
  notes: string;
};

type PetrolSectionProps = {
  petrolClaims: PetrolClaimItem[];
  petrolForm: PetrolFormState;
  uploadingReceipt: boolean;
  onReceiptUpload: (file?: File | null) => void | Promise<void>;
  onSubmit: () => void | Promise<void>;
  setPetrolForm: React.Dispatch<React.SetStateAction<PetrolFormState>>;
};

const CourierPetrolSection = ({
  petrolClaims,
  petrolForm,
  uploadingReceipt,
  onReceiptUpload,
  onSubmit,
  setPetrolForm,
}: PetrolSectionProps) => (
  <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Submit Petrol Claim
      </Typography>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Allowance policy: {defaultSalaryConfig.petrolAllowanceType} - monthly
        cap {formatMoney(defaultSalaryConfig.petrolAllowanceMonthlyCap)}
      </div>
      <div className="grid grid-cols-1 gap-3">
        <TextField
          size="small"
          type="month"
          label="Month"
          value={petrolForm.claimMonth}
          onChange={(event) =>
            setPetrolForm((current) => ({
              ...current,
              claimMonth: event.target.value,
            }))
          }
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          label="Amount"
          value={petrolForm.amount}
          onChange={(event) =>
            setPetrolForm((current) => ({
              ...current,
              amount: event.target.value,
            }))
          }
        />
        <div className="rounded-2xl border border-slate-200 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Receipt Upload
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Upload the petrol receipt file here.
              </Typography>
            </div>
            <Button
              variant="outlined"
              component="label"
              disabled={uploadingReceipt}
            >
              {uploadingReceipt
                ? 'Uploading...'
                : petrolForm.receiptUrl
                  ? 'Replace Receipt'
                  : 'Upload Receipt'}
              <input
                hidden
                type="file"
                accept="image/*,.pdf"
                onChange={(event) =>
                  onReceiptUpload(event.target.files?.[0] || null)
                }
              />
            </Button>
          </div>
          {petrolForm.receiptUrl && (
            <a
              className="mt-3 inline-block text-sm text-blue-600 underline"
              href={petrolForm.receiptUrl}
              target="_blank"
              rel="noreferrer"
            >
              View uploaded receipt
            </a>
          )}
        </div>
        <TextField
          size="small"
          label="Notes"
          multiline
          minRows={3}
          value={petrolForm.notes}
          onChange={(event) =>
            setPetrolForm((current) => ({
              ...current,
              notes: event.target.value,
            }))
          }
        />
      </div>
      <Button variant="contained" onClick={onSubmit}>
        Submit Claim
      </Button>
    </Paper>

    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Petrol Claim History
      </Typography>
      {petrolClaims.map((claim) => (
        <div
          key={String(claim.id)}
          className="rounded-3xl border border-slate-200 p-4 flex items-center justify-between gap-3"
        >
          <div>
            <div className="font-semibold text-slate-900">{claim.month}</div>
            <div className="text-sm text-slate-500">
              {formatMoney(claim.amount)}
            </div>
          </div>
          <Chip
            size="small"
            label={claim.status}
            color={statusTone(claim.status)}
          />
        </div>
      ))}
      {!petrolClaims.length && (
        <Typography color="text.secondary">
          No petrol claims submitted yet.
        </Typography>
      )}
    </Paper>
  </div>
);

export default CourierPetrolSection;
