import React from 'react';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { uploadToCloudinary } from 'shared/utils/uploadToCloudinary';
import {
  initialCodForm,
  initialPetrolForm,
  OTP_COOLDOWN_SECONDS,
  OTP_LENGTH,
} from 'features/courier/courierDashboardConfig';
import { CourierAssignmentItem } from 'features/courier/courierTypes';
import {
  CourierCodFormState,
  CourierDeliveryFormState,
  CourierPetrolFormState,
  CourierToastState,
} from './courierDashboardTypes';

type CreateDeliveryHandlersParams = {
  selectedTask: CourierAssignmentItem | null;
  deliveryAction: string;
  deliveryForm: CourierDeliveryFormState;
  codForm: CourierCodFormState;
  petrolForm: CourierPetrolFormState;
  otpDigits: string;
  isArrivedOrBeyond: boolean;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setVerifyingOtp: React.Dispatch<React.SetStateAction<boolean>>;
  setToast: React.Dispatch<React.SetStateAction<CourierToastState>>;
  setSelectedTask: React.Dispatch<
    React.SetStateAction<CourierAssignmentItem | null>
  >;
  setOtpSent: React.Dispatch<React.SetStateAction<boolean>>;
  setDeliveryAction: React.Dispatch<React.SetStateAction<string>>;
  setDeliveryForm: React.Dispatch<
    React.SetStateAction<CourierDeliveryFormState>
  >;
  setOtpCooldownUntil: React.Dispatch<React.SetStateAction<number | null>>;
  setUploadingProof: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadingReceipt: React.Dispatch<React.SetStateAction<boolean>>;
  setCodForm: React.Dispatch<React.SetStateAction<CourierCodFormState>>;
  setPetrolForm: React.Dispatch<React.SetStateAction<CourierPetrolFormState>>;
  loadWorkspace: () => Promise<void>;
};

export const createDeliveryHandlers = ({
  selectedTask,
  deliveryAction,
  deliveryForm,
  codForm,
  petrolForm,
  otpDigits,
  isArrivedOrBeyond,
  setError,
  setSuccessMessage,
  setVerifyingOtp,
  setToast,
  setSelectedTask,
  setOtpSent,
  setDeliveryAction,
  setDeliveryForm,
  setOtpCooldownUntil,
  setUploadingProof,
  setUploadingReceipt,
  setCodForm,
  setPetrolForm,
  loadWorkspace,
}: CreateDeliveryHandlersParams) => {
  const readErrorMessage = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || fallback;

  const ensureCodDetails = () => {
    if (selectedTask?.paymentType !== 'COD') return true;
    if (!deliveryForm.codAmount || Number(deliveryForm.codAmount) <= 0) {
      setError('Enter collected COD amount before continuing');
      return false;
    }
    if (deliveryForm.codMode === 'UPI') {
      if (!deliveryForm.transactionId.trim()) {
        setError('Transaction ID is required for online COD payment');
        return false;
      }
      if (!deliveryForm.proofPhotoUrl.trim()) {
        setError('Upload online payment screenshot before continuing');
        return false;
      }
    }
    return true;
  };

  const markConfirmationPending = async () => {
    if (!selectedTask) return;
    const isCod = selectedTask.paymentType === 'COD';
    await api.patch(API_ROUTES.courier.deliveryStatus(selectedTask.orderId), {
      status: 'CONFIRMATION_PENDING',
      statusReason: deliveryForm.statusReason || 'OTP sent to customer email',
      statusNote: deliveryForm.statusNote || undefined,
      codCollectedAmount: isCod ? Number(deliveryForm.codAmount) : undefined,
      paymentMode: isCod ? deliveryForm.codMode : undefined,
      paymentScreenshotUrl:
        isCod && deliveryForm.codMode === 'UPI'
          ? deliveryForm.proofPhotoUrl || undefined
          : undefined,
      transactionId:
        isCod && deliveryForm.codMode === 'UPI'
          ? deliveryForm.transactionId || undefined
          : undefined,
      podPhotoUrl: deliveryForm.proofPhotoUrl || undefined,
    });
  };

  const resolveStatusReason = (action: string) =>
    action === 'FAILED'
      ? deliveryForm.failureReason
      : deliveryForm.statusReason;

  const validateDeliveryAction = (
    action: string,
    reason: string,
    otpValue: string,
  ) => {
    if (['CONFIRMATION_PENDING', 'FAILED'].includes(action) && !reason) {
      return 'Please select a reason before saving this status';
    }
    if (action === 'DELIVERED' && !isArrivedOrBeyond) {
      return 'Mark the order as Arrived before verifying OTP.';
    }
    if (action === 'DELIVERED' && !otpValue.length) {
      return 'Enter customer OTP after sending it to complete delivery';
    }
    if (action === 'DELIVERED' && otpValue.length !== OTP_LENGTH) {
      return `Enter the ${OTP_LENGTH}-digit OTP from the customer email`;
    }
    if (
      ['CONFIRMATION_PENDING', 'DELIVERED'].includes(action) &&
      !ensureCodDetails()
    ) {
      return 'INVALID_COD_DETAILS';
    }
    return null;
  };

  const buildDeliveryPayload = (
    action: string,
    reason: string,
    otpValue: string,
    isCod: boolean,
  ) => ({
    status: action,
    statusReason: reason || undefined,
    statusNote: deliveryForm.statusNote || undefined,
    codCollectedAmount:
      isCod && ['CONFIRMATION_PENDING', 'DELIVERED'].includes(action)
        ? Number(deliveryForm.codAmount)
        : undefined,
    paymentMode: isCod ? deliveryForm.codMode : undefined,
    paymentScreenshotUrl:
      isCod && deliveryForm.codMode === 'UPI'
        ? deliveryForm.proofPhotoUrl || undefined
        : undefined,
    transactionId:
      isCod && deliveryForm.codMode === 'UPI'
        ? deliveryForm.transactionId || undefined
        : undefined,
    podOtp: otpValue || undefined,
    podPhotoUrl: deliveryForm.proofPhotoUrl || undefined,
    failureReason:
      action === 'FAILED' ? deliveryForm.failureReason || undefined : undefined,
  });

  const successMessageForAction = (action: string) =>
    action === 'DELIVERED'
      ? 'OTP verified successfully. Delivery completed.'
      : 'Delivery status updated successfully.';

  const handleDeliverySubmit = async (nextStatus?: string) => {
    if (!selectedTask) return;
    setError(null);
    setSuccessMessage(null);
    const action = nextStatus || deliveryAction;
    const isCod = selectedTask.paymentType === 'COD';
    const reason = resolveStatusReason(action);
    const otpValue = otpDigits;
    const validationError = validateDeliveryAction(action, reason, otpValue);

    if (validationError === 'INVALID_COD_DETAILS') {
      return;
    }
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (action === 'DELIVERED') {
        setVerifyingOtp(true);
      }
      await api.patch(
        API_ROUTES.courier.deliveryStatus(selectedTask.orderId),
        buildDeliveryPayload(action, reason, otpValue, isCod),
      );
      const successMessage = successMessageForAction(action);
      setSuccessMessage(successMessage);
      setToast({
        open: true,
        severity: 'success',
        message:
          action === 'DELIVERED'
            ? successMessage
            : 'Status updated successfully.',
      });
      setSelectedTask(null);
      setOtpSent(false);
      await loadWorkspace();
    } catch (requestError: unknown) {
      const serverMessage = readErrorMessage(
        requestError,
        'Failed to update delivery status',
      );
      setError(serverMessage);
      setToast({ open: true, severity: 'error', message: serverMessage });

      if (action === 'DELIVERED' && /arrived/i.test(serverMessage)) {
        setDeliveryAction('ARRIVED');
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSendDeliveryOtp = async () => {
    if (!selectedTask) return;
    setError(null);
    setSuccessMessage(null);

    if (!isArrivedOrBeyond) {
      setError('Mark the order as Arrived before sending OTP.');
      return;
    }

    if (!ensureCodDetails()) {
      return;
    }

    try {
      await markConfirmationPending();
      setOtpSent(true);
      setSuccessMessage('OTP sent successfully to the customer email.');
      setDeliveryAction('DELIVERED');
      setDeliveryForm((current) => ({
        ...current,
        statusReason: current.statusReason || 'OTP sent to customer email',
      }));
      await loadWorkspace();
    } catch (requestError: unknown) {
      if (
        (requestError as { response?: { status?: number } })?.response
          ?.status === 409
      ) {
        setOtpSent(true);
        setSuccessMessage(
          'OTP is already active. Ask the customer for the code and verify delivery.',
        );
        setDeliveryAction('DELIVERED');
        setOtpCooldownUntil(Date.now() + OTP_COOLDOWN_SECONDS * 1000);
        setToast({
          open: true,
          severity: 'info',
          message: 'OTP already active. Enter OTP to verify.',
        });
        setError(
          'OTP already active for this order. Enter the customer OTP and verify delivery.',
        );
        setDeliveryForm((current) => ({
          ...current,
          statusReason: current.statusReason || 'OTP sent to customer email',
        }));
      } else {
        setError(readErrorMessage(requestError, 'Failed to send delivery OTP'));
      }
    }
  };

  const handleProofUpload = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setUploadingProof(true);
    try {
      const url = await uploadToCloudinary(file);
      setDeliveryForm((current) => ({ ...current, proofPhotoUrl: url || '' }));
    } catch (uploadError: unknown) {
      setError(
        (uploadError as { message?: string })?.message ||
          'Failed to upload proof file',
      );
    } finally {
      setUploadingProof(false);
    }
  };

  const handleReceiptUpload = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setUploadingReceipt(true);
    try {
      const url = await uploadToCloudinary(file);
      setPetrolForm((current) => ({ ...current, receiptUrl: url || '' }));
    } catch (uploadError: unknown) {
      setError(
        (uploadError as { message?: string })?.message ||
          'Failed to upload receipt file',
      );
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleCodDepositSubmit = async () => {
    setError(null);
    try {
      await api.post(API_ROUTES.courier.codSettlements, {
        amount: Number(codForm.amount),
        mode: codForm.mode,
        referenceId: codForm.referenceId || undefined,
        settlementDate: codForm.settlementDate || undefined,
      });
      setCodForm(initialCodForm);
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to submit COD deposit'));
    }
  };

  const handlePetrolClaimSubmit = async () => {
    setError(null);
    try {
      await api.post(API_ROUTES.courier.petrolClaims, {
        claimMonth: `${petrolForm.claimMonth}-01`,
        amount: Number(petrolForm.amount),
        receiptUrl: petrolForm.receiptUrl || undefined,
        notes: petrolForm.notes || undefined,
      });
      setPetrolForm(initialPetrolForm);
      await loadWorkspace();
    } catch (requestError: unknown) {
      setError(readErrorMessage(requestError, 'Failed to submit petrol claim'));
    }
  };

  return {
    handleCodDepositSubmit,
    handleDeliverySubmit,
    handlePetrolClaimSubmit,
    handleProofUpload,
    handleReceiptUpload,
    handleSendDeliveryOtp,
  };
};
