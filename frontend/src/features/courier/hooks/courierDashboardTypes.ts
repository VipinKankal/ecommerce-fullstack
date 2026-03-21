import { CodCollectionMode } from 'features/courier/courierTypes';

export type CourierDeliveryFormState = {
  codAmount: string;
  codMode: CodCollectionMode;
  otp: string;
  proofPhotoUrl: string;
  transactionId: string;
  failureReason: string;
  statusReason: string;
  statusNote: string;
};

export type CourierCodFormState = {
  amount: string;
  mode: CodCollectionMode;
  referenceId: string;
  settlementDate: string;
};

export type CourierPetrolFormState = {
  claimMonth: string;
  amount: string;
  receiptUrl: string;
  notes: string;
};

export type CourierReversePickupFormState = {
  proofPhotoUrl: string;
  note: string;
};

export type CourierToastState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};
