import React from 'react';
import { Button, Chip, Paper, TextField, Typography } from '@mui/material';
import {
  formatDateLabel,
  formatMoney,
  statusTone,
} from 'features/courier/courierData';
import {
  CodCollectionItem,
  PetrolClaimItem,
} from 'features/courier/courierTypes';

const replacementSeparator = ' \uFFFD ';

type AdminCourierCodSectionProps = {
  codCollections: CodCollectionItem[];
  onCodSettlementUpdate: (
    id: number | string,
    status: 'APPROVED' | 'REJECTED',
  ) => void | Promise<void>;
  onPetrolClaimUpdate: (
    id: number | string,
    status: 'APPROVED' | 'REJECTED',
  ) => void | Promise<void>;
  petrolClaims: PetrolClaimItem[];
  petrolNotes: Record<string, string>;
  setPetrolNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

const AdminCourierCodSection = ({
  codCollections,
  onCodSettlementUpdate,
  onPetrolClaimUpdate,
  petrolClaims,
  petrolNotes,
  setPetrolNotes,
}: AdminCourierCodSectionProps) => (
  <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        COD Management
      </Typography>
      {codCollections.map((item) => (
        <div
          key={String(item.id)}
          className="rounded-3xl border border-slate-200 p-4 flex flex-col gap-3"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">
                Order #{item.orderId}
              </div>
              <div className="text-sm text-slate-500">
                Courier: {item.courierName || '-'}
                {replacementSeparator}
                {item.paymentMode}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Chip
                size="small"
                label={item.status}
                color={statusTone(item.status)}
              />
              <span className="text-sm font-semibold">
                {formatMoney(item.amount)}
              </span>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            Collected: {formatDateLabel(item.collectedAt)}
            {replacementSeparator}
            Deposit Date: {item.depositDate || 'Pending'}
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="outlined"
              onClick={() => onCodSettlementUpdate(item.id, 'APPROVED')}
            >
              Approve
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => onCodSettlementUpdate(item.id, 'REJECTED')}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
      {!codCollections.length && (
        <Typography color="text.secondary">
          No COD records waiting for review.
        </Typography>
      )}
    </Paper>

    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        Petrol Claims
      </Typography>
      {petrolClaims.map((claim) => (
        <div
          key={String(claim.id)}
          className="rounded-3xl border border-slate-200 p-4 space-y-3"
        >
          <div>
            <div className="font-semibold text-slate-900">
              {claim.courierName || 'Courier'}
            </div>
            <div className="text-sm text-slate-500">
              {claim.month}
              {replacementSeparator}
              {formatMoney(claim.amount)}
            </div>
          </div>
          <TextField
            size="small"
            fullWidth
            label="Reviewer note"
            value={petrolNotes[String(claim.id)] || ''}
            onChange={(event) =>
              setPetrolNotes((current) => ({
                ...current,
                [String(claim.id)]: event.target.value,
              }))
            }
          />
          <div className="flex gap-2">
            <Button
              size="small"
              variant="outlined"
              onClick={() => onPetrolClaimUpdate(claim.id, 'APPROVED')}
            >
              Approve
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => onPetrolClaimUpdate(claim.id, 'REJECTED')}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
      {!petrolClaims.length && (
        <Typography color="text.secondary">
          No petrol claims pending right now.
        </Typography>
      )}
    </Paper>
  </div>
);

export default AdminCourierCodSection;
