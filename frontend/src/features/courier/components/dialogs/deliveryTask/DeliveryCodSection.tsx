import React from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { paymentModeOptions } from 'features/courier/courierDashboardConfig';
import { CodCollectionMode } from 'features/courier/courierTypes';
import { DeliveryFormState } from './CourierDeliveryTaskDialog.types';

type DeliveryCodSectionProps = {
  deliveryForm: DeliveryFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  uploadingProof: boolean;
  onProofUpload: (file?: File | null) => void | Promise<void>;
};

const DeliveryCodSection = ({
  deliveryForm,
  setDeliveryForm,
  uploadingProof,
  onProofUpload,
}: DeliveryCodSectionProps) => (
  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 space-y-3">
    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
      COD Collection
    </Typography>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <TextField
        size="small"
        label="COD Amount"
        value={deliveryForm.codAmount}
        onChange={(event) =>
          setDeliveryForm((current) => ({
            ...current,
            codAmount: event.target.value,
          }))
        }
      />
      <FormControl size="small" fullWidth>
        <InputLabel>Payment Type</InputLabel>
        <Select
          value={deliveryForm.codMode}
          label="Payment Type"
          onChange={(event) =>
            setDeliveryForm((current) => ({
              ...current,
              codMode: event.target.value as CodCollectionMode,
              transactionId:
                event.target.value === 'UPI' ? current.transactionId : '',
              proofPhotoUrl:
                event.target.value === 'UPI' ? current.proofPhotoUrl : '',
            }))
          }
        >
          {paymentModeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {deliveryForm.codMode === 'UPI' ? (
        <TextField
          size="small"
          label="Transaction ID"
          value={deliveryForm.transactionId}
          onChange={(event) =>
            setDeliveryForm((current) => ({
              ...current,
              transactionId: event.target.value,
            }))
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
          Cash payment selected. Transaction ID and screenshot are not required.
        </div>
      )}
    </div>
    {deliveryForm.codMode === 'UPI' && (
      <div className="rounded-2xl border border-slate-200 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Online Payment Screenshot
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upload screenshot when payment type is Online.
            </Typography>
          </div>
          <Button
            variant="outlined"
            component="label"
            disabled={uploadingProof}
          >
            {uploadingProof
              ? 'Uploading...'
              : deliveryForm.proofPhotoUrl
                ? 'Replace Screenshot'
                : 'Upload Screenshot'}
            <input
              hidden
              type="file"
              accept="image/*,.pdf"
              onChange={(event) =>
                onProofUpload(event.target.files?.[0] || null)
              }
            />
          </Button>
        </div>
        {deliveryForm.proofPhotoUrl && (
          <a
            className="mt-3 inline-block text-sm text-blue-600 underline"
            href={deliveryForm.proofPhotoUrl}
            target="_blank"
            rel="noreferrer"
          >
            View uploaded screenshot
          </a>
        )}
      </div>
    )}
  </div>
);

export default DeliveryCodSection;
