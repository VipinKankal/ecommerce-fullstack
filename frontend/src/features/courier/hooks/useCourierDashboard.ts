import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deriveCourierOverview } from 'features/courier/courierData';
import {
  CourierTab,
  OTP_LENGTH,
  initialCodForm,
  initialPetrolForm,
  monthValue,
  reversePickupCompletedStatuses,
  reversePickupReadyStatuses,
  statusReasonOptions,
  transitionOptions,
} from 'features/courier/courierDashboardConfig';
import {
  CodCollectionItem,
  CodCollectionMode,
  CourierAssignmentItem,
  EarningsBreakdown,
  PetrolClaimItem,
} from 'features/courier/courierTypes';
import { createDeliveryHandlers } from './courierDashboardDeliveryHandlers';
import { createOtpHandlers } from './courierDashboardOtpHandlers';
import { createReversePickupHandlers } from './courierDashboardReversePickupHandlers';
import { createTaskDialogHandlers } from './courierDashboardTaskHandlers';
import {
  CourierCodFormState,
  CourierDeliveryFormState,
  CourierPetrolFormState,
  CourierReversePickupFormState,
  CourierToastState,
} from './courierDashboardTypes';
import { loadCourierWorkspaceData } from './courierDashboardWorkspace';

const readErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ||
  (error as { message?: string })?.message ||
  fallback;

export const useCourierDashboard = () => {
  const [activeTab, setActiveTab] = useState<CourierTab>('deliveries');
  const [assignments, setAssignments] = useState<CourierAssignmentItem[]>([]);
  const [codItems, setCodItems] = useState<CodCollectionItem[]>([]);
  const [petrolClaims, setPetrolClaims] = useState<PetrolClaimItem[]>([]);
  const [earnings, setEarnings] = useState<EarningsBreakdown | null>(null);
  const [month, setMonth] = useState(monthValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] =
    useState<CourierAssignmentItem | null>(null);
  const [selectedReverseTask, setSelectedReverseTask] =
    useState<CourierAssignmentItem | null>(null);
  const [deliveryAction, setDeliveryAction] = useState('ACCEPTED');
  const [deliveryForm, setDeliveryForm] = useState<CourierDeliveryFormState>({
    codAmount: '',
    codMode: 'CASH' as CodCollectionMode,
    otp: '',
    proofPhotoUrl: '',
    transactionId: '',
    failureReason: '',
    statusReason: '',
    statusNote: '',
  });
  const [codForm, setCodForm] = useState<CourierCodFormState>(initialCodForm);
  const [petrolForm, setPetrolForm] =
    useState<CourierPetrolFormState>(initialPetrolForm);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadingReverseProof, setUploadingReverseProof] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpCooldownUntil, setOtpCooldownUntil] = useState<number | null>(null);
  const [otpCooldownNow, setOtpCooldownNow] = useState(() => Date.now());
  const [toast, setToast] = useState<CourierToastState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [reversePickupForm, setReversePickupForm] =
    useState<CourierReversePickupFormState>({
      proofPhotoUrl: '',
      note: '',
    });
  const [submittingReversePickup, setSubmittingReversePickup] = useState(false);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const overview = useMemo(
    () => deriveCourierOverview(assignments, codItems),
    [assignments, codItems],
  );
  const returnAssignments = useMemo(
    () => assignments.filter((task) => task.taskFlow === 'RETURN'),
    [assignments],
  );
  const visibleReverseAssignments = useMemo(
    () =>
      returnAssignments.filter((task) => {
        const reverseStatus = (task.returnStatus || '').toUpperCase();
        return (
          Boolean(task.reverseTaskId) ||
          reversePickupReadyStatuses.has(reverseStatus) ||
          reversePickupCompletedStatuses.has(reverseStatus)
        );
      }),
    [returnAssignments],
  );
  const returnPickupAssignments = useMemo(
    () =>
      visibleReverseAssignments.filter(
        (task) => task.reverseType !== 'EXCHANGE',
      ),
    [visibleReverseAssignments],
  );
  const exchangePickupAssignments = useMemo(
    () =>
      visibleReverseAssignments.filter(
        (task) => task.reverseType === 'EXCHANGE',
      ),
    [visibleReverseAssignments],
  );
  const activeAssignments = useMemo(
    () =>
      assignments.filter(
        (task) =>
          task.taskFlow !== 'RETURN' && task.courierTaskStatus !== 'DELIVERED',
      ),
    [assignments],
  );
  const deliveredAssignments = useMemo(
    () =>
      assignments.filter(
        (task) =>
          task.taskFlow !== 'RETURN' && task.courierTaskStatus === 'DELIVERED',
      ),
    [assignments],
  );
  const isConfirmationStep =
    deliveryAction === 'DELIVERED' ||
    selectedTask?.courierTaskStatus === 'CONFIRMATION_PENDING' ||
    otpSent;
  const isArrivedOrBeyond = [
    'ARRIVED',
    'CONFIRMATION_PENDING',
    'DELIVERED',
  ].includes(selectedTask?.courierTaskStatus || '');
  const safeDeliveryAction = transitionOptions.some(
    (option) => option.value === deliveryAction,
  )
    ? deliveryAction
    : 'DELIVERED';
  const currentReasonKey =
    deliveryAction === 'ACCEPTED' ? 'ASSIGNED' : deliveryAction;
  const currentReasonOptions = statusReasonOptions[currentReasonKey] || [];
  const selectedReasonValue =
    deliveryAction === 'FAILED'
      ? deliveryForm.failureReason
      : deliveryForm.statusReason;
  const safeSelectedReasonValue = currentReasonOptions.includes(
    selectedReasonValue,
  )
    ? selectedReasonValue
    : '';
  const otpDigits = (deliveryForm.otp ?? '')
    .replace(/\D/g, '')
    .slice(0, OTP_LENGTH);
  const otpLooksEntered = otpDigits.length >= 4;
  const otpVerified = Boolean(selectedTask?.otpVerified);
  const otpError = /otp/i.test(error || '');

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const workspaceData = await loadCourierWorkspaceData(month);
      setAssignments(workspaceData.assignments);
      setEarnings(workspaceData.earnings);
      setCodItems(workspaceData.codItems);
      setPetrolClaims(workspaceData.petrolClaims);
    } catch (workspaceError: unknown) {
      setError(
        readErrorMessage(workspaceError, 'Failed to load courier workspace'),
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const { closeTaskDialog, handleDeliveryActionChange, openTask } =
    createTaskDialogHandlers({
      setSelectedTask,
      setSuccessMessage,
      setError,
      setOtpSent,
      setDeliveryAction,
      setDeliveryForm,
    });

  const {
    closeReverseTask,
    handleAcceptReversePickup,
    handleReversePickupSubmit,
    handleReverseProofUpload,
    handleStartReversePickup,
    isReversePickupAccepted,
    isReversePickupInProgress,
    openReverseTask,
  } = createReversePickupHandlers({
    selectedReverseTask,
    reversePickupForm,
    setSelectedReverseTask,
    setReversePickupForm,
    setSuccessMessage,
    setError,
    setAssignments,
    setToast,
    setSubmittingReversePickup,
    setUploadingReverseProof,
    loadWorkspace,
  });

  const {
    handleCodDepositSubmit,
    handleDeliverySubmit,
    handlePetrolClaimSubmit,
    handleProofUpload,
    handleReceiptUpload,
    handleSendDeliveryOtp,
  } = createDeliveryHandlers({
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
  });

  useEffect(() => {
    if (!otpCooldownUntil) return;
    const id = globalThis.setInterval(() => setOtpCooldownNow(Date.now()), 250);
    return () => globalThis.clearInterval(id);
  }, [otpCooldownUntil]);

  const otpCooldownSeconds = otpCooldownUntil
    ? Math.max(0, Math.ceil((otpCooldownUntil - otpCooldownNow) / 1000))
    : 0;
  const otpCooldownActive = otpCooldownSeconds > 0;
  const otpSlots = Array.from({ length: OTP_LENGTH }).map((_, index) =>
    otpDigits.charAt(index),
  );

  const { handleOtpInputChange, handleOtpKeyDown, handleOtpPaste } =
    createOtpHandlers({
      otpSlots,
      otpRefs,
      setDeliveryForm,
      setError,
    });

  return {
    activeAssignments,
    activeTab,
    closeReverseTask,
    closeTaskDialog,
    codForm,
    codItems,
    currentReasonOptions,
    deliveredAssignments,
    deliveryAction,
    deliveryForm,
    earnings,
    error,
    exchangePickupAssignments,
    handleAcceptReversePickup,
    handleCodDepositSubmit,
    handleDeliveryActionChange,
    handleDeliverySubmit,
    handleOtpInputChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handlePetrolClaimSubmit,
    handleProofUpload,
    handleReceiptUpload,
    handleReversePickupSubmit,
    handleReverseProofUpload,
    handleSendDeliveryOtp,
    handleStartReversePickup,
    isConfirmationStep,
    isReversePickupAccepted,
    isReversePickupInProgress,
    isArrivedOrBeyond,
    loadWorkspace,
    loading,
    month,
    openReverseTask,
    openTask,
    otpCooldownActive,
    otpCooldownSeconds,
    otpError,
    otpLooksEntered,
    otpRefs,
    otpSent,
    otpSlots,
    otpVerified,
    overview,
    petrolClaims,
    petrolForm,
    returnPickupAssignments,
    reversePickupForm,
    safeDeliveryAction,
    safeSelectedReasonValue,
    selectedReverseTask,
    selectedTask,
    setActiveTab,
    setCodForm,
    setDeliveryForm,
    setMonth,
    setPetrolForm,
    setReversePickupForm,
    setToast,
    submittingReversePickup,
    successMessage,
    toast,
    uploadingProof,
    uploadingReceipt,
    uploadingReverseProof,
    verifyingOtp,
  };
};
