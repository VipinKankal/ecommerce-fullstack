import React from 'react';
import { Button, TextField, Typography } from '@mui/material';
import { DeliveryFormState } from './CourierDeliveryTaskDialog.types';

type DeliveryProofAndFailureSectionProps = {
  isConfirmationStep: boolean;
  isCodPayment: boolean;
  deliveryForm: DeliveryFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  uploadingProof: boolean;
  onProofUpload: (file?: File | null) => void | Promise<void>;
};

const DeliveryProofAndFailureSection = ({
  isConfirmationStep,
  isCodPayment,
  deliveryForm,
  setDeliveryForm,
  uploadingProof,
  onProofUpload,
}: DeliveryProofAndFailureSectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {isConfirmationStep && !isCodPayment ? (
      <div className="rounded-2xl border border-slate-200 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Delivery Proof Photo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Optional proof for delivered prepaid orders.
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
                ? 'Replace Photo'
                : 'Upload Photo'}
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
            View uploaded proof
          </a>
        )}
      </div>
    ) : (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        Proof input opens here only when the Delivered flow needs it.
      </div>
    )}
    <TextField
      size="small"
      label="Failure Reason"
      value={deliveryForm.failureReason}
      onChange={(event) =>
        setDeliveryForm((current) => ({
          ...current,
          failureReason: event.target.value,
        }))
      }
      helperText="Required only when marking failed delivery"
    />
  </div>
);

export default DeliveryProofAndFailureSection;
