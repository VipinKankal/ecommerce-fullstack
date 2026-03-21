import React from 'react';
import {
  CodCollectionMode,
  CourierAssignmentItem,
} from 'features/courier/courierTypes';

export type DeliveryFormState = {
  codAmount: string;
  codMode: CodCollectionMode;
  otp: string;
  proofPhotoUrl: string;
  transactionId: string;
  failureReason: string;
  statusReason: string;
  statusNote: string;
};

export type OtpInputRefs = {
  current: Array<HTMLInputElement | null>;
};

export type CourierDeliveryTaskDialogProps = {
  open: boolean;
  selectedTask: CourierAssignmentItem | null;
  deliveryAction: string;
  safeDeliveryAction: string;
  onDeliveryActionChange: (value: string) => void;
  isConfirmationStep: boolean;
  isArrivedOrBeyond: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  otpError: boolean;
  otpLooksEntered: boolean;
  otpCooldownActive: boolean;
  otpCooldownSeconds: number;
  deliveryForm: DeliveryFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  successMessage: string | null;
  error: string | null;
  verifyingOtp: boolean;
  uploadingProof: boolean;
  otpSlots: string[];
  otpRefs: OtpInputRefs;
  currentReasonOptions: string[];
  safeSelectedReasonValue: string;
  onClose: () => void;
  onSendDeliveryOtp: () => void | Promise<void>;
  onDeliverySubmit: (nextStatus?: string) => void | Promise<void>;
  onOtpKeyDown: (
    index: number,
    event: React.KeyboardEvent<HTMLElement>,
  ) => void;
  onOtpPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onOtpInputChange: (index: number, value: string) => void;
  onProofUpload: (file?: File | null) => void | Promise<void>;
};
