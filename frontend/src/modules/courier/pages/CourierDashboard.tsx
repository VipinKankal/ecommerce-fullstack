import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { api } from "shared/api/Api";
import { uploadToCloudinary } from "shared/utils/uploadToCloudinary";
import { API_ROUTES } from "shared/api/ApiRoutes";
import CourierExchangePickupList from "modules/courier/components/CourierExchangePickupList";
import {
  defaultSalaryConfig,
  deriveCourierOverview,
  formatDateLabel,
  formatMoney,
  getPaymentBadgeLabel,
  loadCourierAssignments,
  loadCourierEarnings,
  mapCodCollection,
  mapPetrolClaim,
  statusTone,
} from "modules/courier/courierData";
import {
  CodCollectionItem,
  CodCollectionMode,
  CourierAssignmentItem,
  EarningsBreakdown,
  PetrolClaimItem,
} from "modules/courier/courierTypes";

type CourierTab = "deliveries" | "returnPickups" | "exchangePickups" | "delivered" | "cod" | "petrol" | "earnings";


type ReversePickupTaskRecord = {
  id: number | string;
  requestId?: number | string;
  orderId?: number | string;
  orderItemId?: number | string;
  requestType?: string;
  returnStatus?: string;
  reasonCode?: string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  productTitle?: string;
  productImage?: string;
  amount?: number;
  status?: string;
  pickupNote?: string;
  proofUrl?: string;
  scheduledAt?: string;
  pickedAt?: string;
  completedAt?: string;
  courierName?: string;
  courierPhone?: string;
};

const reversePickupReadyStatuses = new Set([
  "RETURN_APPROVED",
  "RETURN_PICKUP_SCHEDULED",
  "EXCHANGE_APPROVED",
  "EXCHANGE_PICKUP_SCHEDULED",
]);

const reversePickupCompletedStatuses = new Set([
  "RETURN_PICKED",
  "OLD_PRODUCT_PICKED",
  "RETURN_RECEIVED",
  "REFUND_INITIATED",
  "REFUND_COMPLETED",
  "REPLACEMENT_ORDER_CREATED",
  "REPLACEMENT_SHIPPED",
  "REPLACEMENT_DELIVERED",
  "EXCHANGE_COMPLETED",
]);

const mapReversePickupTask = (item: any): ReversePickupTaskRecord => ({
  id: item?.id ?? item?.taskId ?? item?.requestId,
  requestId: item?.requestId ?? item?.returnRequestId,
  orderId: item?.orderId,
  orderItemId: item?.orderItemId,
  requestType: item?.requestType,
  returnStatus: item?.returnStatus,
  reasonCode: item?.reasonCode,
  customerName: item?.customerName,
  customerPhone: item?.customerPhone,
  pickupAddress: item?.pickupAddress,
  productTitle: item?.productTitle,
  productImage: item?.productImage,
  amount: typeof item?.amount === "number" ? item.amount : Number(item?.amount || 0),
  status: (item?.status || "PICKUP_SCHEDULED").toUpperCase(),
  pickupNote: item?.pickupNote || item?.note,
  proofUrl: item?.proofUrl,
  scheduledAt: item?.scheduledAt,
  pickedAt: item?.pickedAt,
  completedAt: item?.completedAt,
  courierName: item?.courierName,
  courierPhone: item?.courierPhone,
});

const mergeAssignmentsWithReverseTasks = (
  assignmentItems: CourierAssignmentItem[],
  reverseTasks: ReversePickupTaskRecord[],
): CourierAssignmentItem[] => {
  if (!reverseTasks.length) return assignmentItems;

  const mergedAssignments = assignmentItems.map((task) => {
    if (task.taskFlow !== "RETURN") {
      return task;
    }

    const matchedTask = reverseTasks.find((reverseTask) => {
      const candidateRequestId = task.returnId ?? task.id;
      return String(reverseTask.requestId ?? "") === String(candidateRequestId ?? "");
    });

    if (!matchedTask) {
      return task;
    }

    return {
      ...task,
      orderId: task.orderId ?? matchedTask.orderId ?? task.id,
      returnId: task.returnId ?? matchedTask.requestId,
      customerName: task.customerName || matchedTask.customerName || "Customer",
      customerPhone: task.customerPhone || matchedTask.customerPhone,
      address: task.address || matchedTask.pickupAddress || "Address unavailable",
      amount: task.amount || matchedTask.amount || 0,
      itemTitle: task.itemTitle || matchedTask.productTitle,
      returnReason: task.returnReason || matchedTask.reasonCode,
      reverseType: task.reverseType || (matchedTask.requestType === "EXCHANGE" ? "EXCHANGE" : "RETURN"),
      reverseTaskId: matchedTask.id,
      reversePickupTaskStatus: matchedTask.status,
      reverseScheduledAt: matchedTask.scheduledAt,
      reversePickedAt: matchedTask.pickedAt,
      proofPhotoUrl: matchedTask.proofUrl || task.proofPhotoUrl,
      statusNote: matchedTask.pickupNote || task.statusNote,
      courierName: task.courierName || matchedTask.courierName,
      courierPhone: task.courierPhone || matchedTask.courierPhone,
      returnStatus: matchedTask.returnStatus || task.returnStatus,
    };
  });

  const syntheticAssignments = reverseTasks
    .filter((reverseTask) => !mergedAssignments.some((task) => {
      if (task.taskFlow !== "RETURN") {
        return false;
      }

      const candidateRequestId = task.returnId ?? task.reverseTaskId ?? task.id;
      return String(candidateRequestId ?? "") === String(reverseTask.requestId ?? "");
    }))
    .map((reverseTask): CourierAssignmentItem => ({
      id: reverseTask.id,
      orderId: reverseTask.orderId ?? reverseTask.requestId ?? reverseTask.id,
      returnId: reverseTask.requestId,
      customerName: reverseTask.customerName || "Customer",
      customerPhone: reverseTask.customerPhone,
      address: reverseTask.pickupAddress || "Address unavailable",
      paymentType: "PAID",
      paymentStatus: "PAID",
      amount: reverseTask.amount || 0,
      courierName: reverseTask.courierName,
      courierPhone: reverseTask.courierPhone,
      courierTaskStatus: "ASSIGNED",
      shipmentStatus: "LABEL_CREATED",
      requiresOtp: false,
      taskFlow: "RETURN",
      reverseType: reverseTask.requestType === "EXCHANGE" ? "EXCHANGE" : "RETURN",
      reverseTaskId: reverseTask.id,
      reversePickupTaskStatus: reverseTask.status,
      reverseScheduledAt: reverseTask.scheduledAt,
      reversePickedAt: reverseTask.pickedAt,
      returnStatus: reverseTask.returnStatus,
      returnReason: reverseTask.reasonCode,
      itemTitle: reverseTask.productTitle,
      proofPhotoUrl: reverseTask.proofUrl,
      statusNote: reverseTask.pickupNote,
    }));

  return [...mergedAssignments, ...syntheticAssignments];
};
const OTP_LENGTH = 6;
const OTP_COOLDOWN_SECONDS = 30;


const monthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const initialCodForm = {
  amount: "",
  mode: "CASH" as CodCollectionMode,
  referenceId: "",
  settlementDate: "",
};

const initialPetrolForm = {
  claimMonth: monthValue(),
  amount: "",
  receiptUrl: "",
  notes: "",
};

const paymentModeOptions = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "Online" },
];

const statusReasonOptions: Record<string, string[]> = {
  ASSIGNED: ["Auto assigned by system", "Assigned by admin", "Reassigned from another courier", "Zone based assignment", "Batch dispatch assignment"],
  PICKED_UP: ["Picked up from warehouse", "Picked up from seller", "Picked up from dispatch center", "Package verified and collected", "Ready for delivery route"],
  OUT_FOR_DELIVERY: ["Left delivery hub", "Started delivery route", "Going to customer address", "Delivery scheduled in current slot", "Route started after pickup"],
  ARRIVED: ["Reached customer address", "At gate / building entrance", "Waiting for customer", "Calling customer", "Customer requested wait"],
  DELIVERED: ["OTP verified successfully", "Delivered to customer", "Delivered after COD collection", "Delivered after online confirmation", "Package accepted by customer", "Delivery proof captured"],
  FAILED: ["Customer not reachable", "Customer did not answer", "Wrong address", "Address not serviceable", "Customer unavailable", "Customer requested reschedule", "Customer refused order", "OTP not shared", "COD payment unavailable", "UPI payment failed", "Entry denied by security", "Address not found", "Vehicle breakdown", "Weather issue", "Package damaged", "Order cancelled"],
};
const transitionOptions = [
  { value: "ACCEPTED", label: "Accept Task" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "OUT_FOR_DELIVERY", label: "Out For Delivery" },
  { value: "ARRIVED", label: "Arrived At Location" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed Delivery" },
];

const CourierDashboard = () => {
  const [activeTab, setActiveTab] = useState<CourierTab>("deliveries");
  const [assignments, setAssignments] = useState<CourierAssignmentItem[]>([]);
  const [codItems, setCodItems] = useState<CodCollectionItem[]>([]);
  const [petrolClaims, setPetrolClaims] = useState<PetrolClaimItem[]>([]);
  const [earnings, setEarnings] = useState<EarningsBreakdown | null>(null);
  const [month, setMonth] = useState(monthValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<CourierAssignmentItem | null>(null);
  const [selectedReverseTask, setSelectedReverseTask] = useState<CourierAssignmentItem | null>(null);
  const [deliveryAction, setDeliveryAction] = useState("ACCEPTED");
  const [deliveryForm, setDeliveryForm] = useState({
    codAmount: "",
    codMode: "CASH" as CodCollectionMode,
    otp: "",
    proofPhotoUrl: "",
    transactionId: "",
    failureReason: "",
    statusReason: "",
    statusNote: "",
  });
  const [codForm, setCodForm] = useState(initialCodForm);
  const [petrolForm, setPetrolForm] = useState(initialPetrolForm);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadingReverseProof, setUploadingReverseProof] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpCooldownUntil, setOtpCooldownUntil] = useState<number | null>(null);
  const [otpCooldownNow, setOtpCooldownNow] = useState(() => Date.now());
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" as any });
  const [reversePickupForm, setReversePickupForm] = useState({ proofPhotoUrl: "", note: "" });
  const [submittingReversePickup, setSubmittingReversePickup] = useState(false);

  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  const overview = useMemo(() => deriveCourierOverview(assignments, codItems), [assignments, codItems]);
  const returnAssignments = useMemo(() => assignments.filter((task) => task.taskFlow === "RETURN"), [assignments]);
  const visibleReverseAssignments = useMemo(() => returnAssignments.filter((task) => {
    const reverseStatus = (task.returnStatus || "").toUpperCase();
    return Boolean(task.reverseTaskId)
      || reversePickupReadyStatuses.has(reverseStatus)
      || reversePickupCompletedStatuses.has(reverseStatus);
  }), [returnAssignments]);
  const returnPickupAssignments = useMemo(() => visibleReverseAssignments.filter((task) => task.reverseType !== "EXCHANGE"), [visibleReverseAssignments]);
  const exchangePickupAssignments = useMemo(() => visibleReverseAssignments.filter((task) => task.reverseType === "EXCHANGE"), [visibleReverseAssignments]);
  const activeAssignments = useMemo(() => assignments.filter((task) => task.taskFlow !== "RETURN" && task.courierTaskStatus !== "DELIVERED"), [assignments]);
  const deliveredAssignments = useMemo(() => assignments.filter((task) => task.taskFlow !== "RETURN" && task.courierTaskStatus === "DELIVERED"), [assignments]);
  const isConfirmationStep = deliveryAction === "DELIVERED" || selectedTask?.courierTaskStatus === "CONFIRMATION_PENDING" || otpSent;
  const isArrivedOrBeyond = selectedTask ? ["ARRIVED", "CONFIRMATION_PENDING", "DELIVERED"].includes(selectedTask.courierTaskStatus) : false;
  const safeDeliveryAction = transitionOptions.some((option) => option.value === deliveryAction) ? deliveryAction : "DELIVERED";
  const currentReasonKey = deliveryAction === "ACCEPTED" ? "ASSIGNED" : deliveryAction;
  const currentReasonOptions = statusReasonOptions[currentReasonKey] || [];
  const selectedReasonValue = deliveryAction === "FAILED" ? deliveryForm.failureReason : deliveryForm.statusReason;
  const safeSelectedReasonValue = currentReasonOptions.includes(selectedReasonValue) ? selectedReasonValue : "";
  const otpDigits = (deliveryForm.otp ?? "").replace(/\D/g, "").slice(0, OTP_LENGTH);
  const otpLooksEntered = otpDigits.length >= 4;

  const otpVerified = Boolean(selectedTask?.otpVerified);
  const otpError = /otp/i.test(error || "");
  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentList, reversePickupResponse, earningsData, codResponse, petrolResponse] = await Promise.allSettled([
        loadCourierAssignments(),
        api.get(API_ROUTES.courier.reversePickups),
        loadCourierEarnings(month),
        api.get(API_ROUTES.courier.codSettlements),
        api.get(API_ROUTES.courier.petrolClaims),
      ]);

      const reverseTasks = reversePickupResponse.status === "fulfilled"
        ? (Array.isArray(reversePickupResponse.value.data) ? reversePickupResponse.value.data : []).map(mapReversePickupTask)
        : [];

      if (assignmentList.status === "fulfilled") {
        setAssignments(mergeAssignmentsWithReverseTasks(assignmentList.value, reverseTasks));
      } else if (reverseTasks.length) {
        setAssignments(mergeAssignmentsWithReverseTasks([], reverseTasks));
      } else {
        setAssignments([]);
      }

      if (earningsData.status === "fulfilled") {
        setEarnings(earningsData.value);
      }
      if (codResponse.status === "fulfilled") {
        setCodItems((Array.isArray(codResponse.value.data) ? codResponse.value.data : []).map(mapCodCollection));
      } else {
        setCodItems([]);
      }
      if (petrolResponse.status === "fulfilled") {
        setPetrolClaims((Array.isArray(petrolResponse.value.data) ? petrolResponse.value.data : []).map(mapPetrolClaim));
      } else {
        setPetrolClaims([]);
      }
    } catch (workspaceError: any) {
      setError(workspaceError?.response?.data?.message || "Failed to load courier workspace");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const openTask = (task: CourierAssignmentItem) => {
    setSelectedTask(task);
    setSuccessMessage(null);
    setError(null);
    setOtpSent(Boolean(task.otpVerified || task.courierTaskStatus === "CONFIRMATION_PENDING" || task.courierTaskStatus === "DELIVERED"));
    setDeliveryAction(task.courierTaskStatus === "ASSIGNED" ? "ACCEPTED" : task.courierTaskStatus === "CONFIRMATION_PENDING" ? "DELIVERED" : task.courierTaskStatus);
    setDeliveryForm({
      codAmount: task.codAmount ? String(task.codAmount) : String(task.amount || ""),
      codMode: "CASH",
      otp: "",
      proofPhotoUrl: task.proofPhotoUrl || "",
      transactionId: "",
      failureReason: task.failureReason || "",
      statusReason: task.statusReason || "",
      statusNote: task.statusNote || "",
    });
  };

  const openReverseTask = (task: CourierAssignmentItem) => {
    setSelectedReverseTask(task);
    setSuccessMessage(null);
    setError(null);
    setReversePickupForm({
      proofPhotoUrl: task.proofPhotoUrl || "",
      note: task.statusNote || "",
    });
  };

  const closeReverseTask = () => {
    setSelectedReverseTask(null);
    setReversePickupForm({ proofPhotoUrl: "", note: "" });
    setSuccessMessage(null);
  };

  const isReversePickupAccepted = (task?: CourierAssignmentItem | null) => {
    if (!task) return false;
    return ["ACCEPTED", "IN_PROGRESS", "PICKED", "COMPLETED"].includes((task.reversePickupTaskStatus || "").toUpperCase())
      || reversePickupCompletedStatuses.has((task.returnStatus || "").toUpperCase());
  };

  const isReversePickupInProgress = (task?: CourierAssignmentItem | null) => {
    if (!task) return false;
    return ["IN_PROGRESS", "PICKED", "COMPLETED"].includes((task.reversePickupTaskStatus || "").toUpperCase())
      || reversePickupCompletedStatuses.has((task.returnStatus || "").toUpperCase());
  };

  const handleAcceptReversePickup = async () => {
    if (!selectedReverseTask) return;
    const taskId = selectedReverseTask.reverseTaskId ?? selectedReverseTask.returnId ?? selectedReverseTask.id;

    setSubmittingReversePickup(true);
    setError(null);
    try {
      await api.patch(API_ROUTES.courier.reversePickupStatus(taskId), {
        status: "ACCEPTED",
        note: reversePickupForm.note || undefined,
      });
      setAssignments((current) => current.map((task) =>
        String(task.reverseTaskId ?? task.returnId ?? task.id) === String(taskId)
          ? { ...task, reversePickupTaskStatus: "ACCEPTED", statusNote: reversePickupForm.note || task.statusNote }
          : task,
      ));
      setSelectedReverseTask((current) => current ? { ...current, reversePickupTaskStatus: "ACCEPTED", statusNote: reversePickupForm.note || current.statusNote } : current);
      setToast({ open: true, severity: "success" as any, message: "Pickup accepted successfully." });
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to accept pickup task");
    } finally {
      setSubmittingReversePickup(false);
    }
  };

  const handleStartReversePickup = async () => {
    if (!selectedReverseTask) return;
    const taskId = selectedReverseTask.reverseTaskId ?? selectedReverseTask.returnId ?? selectedReverseTask.id;

    setSubmittingReversePickup(true);
    setError(null);
    try {
      await api.patch(API_ROUTES.courier.reversePickupStatus(taskId), {
        status: "IN_PROGRESS",
        note: reversePickupForm.note || undefined,
      });
      setAssignments((current) => current.map((task) =>
        String(task.reverseTaskId ?? task.returnId ?? task.id) === String(taskId)
          ? { ...task, reversePickupTaskStatus: "IN_PROGRESS", statusNote: reversePickupForm.note || task.statusNote }
          : task,
      ));
      setSelectedReverseTask((current) => current ? { ...current, reversePickupTaskStatus: "IN_PROGRESS", statusNote: reversePickupForm.note || current.statusNote } : current);
      setToast({ open: true, severity: "success" as any, message: "Pickup marked in progress." });
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to start pickup task");
    } finally {
      setSubmittingReversePickup(false);
    }
  };

  const handleReverseProofUpload = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setUploadingReverseProof(true);
    try {
      const url = await uploadToCloudinary(file);
      setReversePickupForm((current) => ({ ...current, proofPhotoUrl: url || "" }));
    } catch (uploadError: any) {
      setError(uploadError?.message || "Failed to upload pickup proof");
    } finally {
      setUploadingReverseProof(false);
    }
  };

  const handleReversePickupSubmit = async () => {
    if (!selectedReverseTask) return;

    if (!isReversePickupAccepted(selectedReverseTask)) {
      setError("Accept the pickup task before marking the item picked.");
      return;
    }

    if (!reversePickupForm.proofPhotoUrl.trim()) {
      setError("Upload pickup photo before marking the item picked.");
      return;
    }

    const taskId = selectedReverseTask.reverseTaskId ?? selectedReverseTask.returnId ?? selectedReverseTask.id;

    setSubmittingReversePickup(true);
    setError(null);
    try {
      await api.patch(API_ROUTES.courier.reversePickupStatus(taskId), {
        status: "PICKED",
        note: reversePickupForm.note || undefined,
        proofUrl: reversePickupForm.proofPhotoUrl || undefined,
      });

      const pickedStatus = selectedReverseTask.reverseType === "EXCHANGE" ? "OLD_PRODUCT_PICKED" : "RETURN_PICKED";
      setAssignments((current) => current.map((task) => {
        if (String(task.returnId ?? task.id) !== String(selectedReverseTask.returnId ?? selectedReverseTask.id)) {
          return task;
        }

        return {
          ...task,
          proofPhotoUrl: reversePickupForm.proofPhotoUrl,
          statusNote: reversePickupForm.note,
          reversePickupTaskStatus: "PICKED",
          reversePickedAt: new Date().toISOString(),
          returnStatus: pickedStatus,
        };
      }));

      setToast({ open: true, severity: "success" as any, message: "Pickup marked successfully." });
      closeReverseTask();
      await loadWorkspace();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to update reverse pickup status");
    } finally {
      setSubmittingReversePickup(false);
    }
  };

  const ensureCodDetails = () => {
    if (!selectedTask || selectedTask.paymentType !== "COD") return true;
    if (!deliveryForm.codAmount || Number(deliveryForm.codAmount) <= 0) {
      setError("Enter collected COD amount before continuing");
      return false;
    }
    if (deliveryForm.codMode === "UPI") {
      if (!deliveryForm.transactionId.trim()) {
        setError("Transaction ID is required for online COD payment");
        return false;
      }
      if (!deliveryForm.proofPhotoUrl.trim()) {
        setError("Upload online payment screenshot before continuing");
        return false;
      }
    }
    return true;
  };

  const markConfirmationPending = async () => {
    if (!selectedTask) return;
    const isCod = selectedTask.paymentType === "COD";
    await api.patch(API_ROUTES.courier.deliveryStatus(selectedTask.orderId), {
      status: "CONFIRMATION_PENDING",
      statusReason: deliveryForm.statusReason || "OTP sent to customer email",
      statusNote: deliveryForm.statusNote || undefined,
      codCollectedAmount: isCod ? Number(deliveryForm.codAmount) : undefined,
      paymentMode: isCod ? deliveryForm.codMode : undefined,
      paymentScreenshotUrl:
        isCod && deliveryForm.codMode === "UPI" ? deliveryForm.proofPhotoUrl || undefined : undefined,
      transactionId:
        isCod && deliveryForm.codMode === "UPI" ? deliveryForm.transactionId || undefined : undefined,
      podPhotoUrl: deliveryForm.proofPhotoUrl || undefined,
    });
  };

  const handleDeliverySubmit = async (nextStatus?: string) => {
    if (!selectedTask) return;
    setError(null);
    setSuccessMessage(null);
    const action = nextStatus || deliveryAction;
    const isCod = selectedTask.paymentType === "COD";
    const reason = action === "FAILED" ? deliveryForm.failureReason : deliveryForm.statusReason;
    const otpValue = otpDigits;

    if (["CONFIRMATION_PENDING", "FAILED"].includes(action) && !reason) {
      setError("Please select a reason before saving this status");
      return;
    }

    if (action === "DELIVERED" && !isArrivedOrBeyond) {
      setError("Mark the order as Arrived before verifying OTP.");
      return;
    }

    if (action === "DELIVERED" && !otpValue.length) {
      setError("Enter customer OTP after sending it to complete delivery");
      return;
    }

    if (action === "DELIVERED" && otpValue.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit OTP from the customer email`);
      return;
    }

    if (["CONFIRMATION_PENDING", "DELIVERED"].includes(action) && !ensureCodDetails()) {
      return;
    }

    try {
      if (action === "DELIVERED") {
        setVerifyingOtp(true);
      }
      await api.patch(API_ROUTES.courier.deliveryStatus(selectedTask.orderId), {
        status: action,
        statusReason: reason || undefined,
        statusNote: deliveryForm.statusNote || undefined,
        codCollectedAmount: isCod && ["CONFIRMATION_PENDING", "DELIVERED"].includes(action)
          ? Number(deliveryForm.codAmount)
          : undefined,
        paymentMode: isCod ? deliveryForm.codMode : undefined,
        paymentScreenshotUrl:
          isCod && deliveryForm.codMode === "UPI" ? deliveryForm.proofPhotoUrl || undefined : undefined,
        transactionId:
          isCod && deliveryForm.codMode === "UPI" ? deliveryForm.transactionId || undefined : undefined,
        podOtp: otpValue || undefined,
        podPhotoUrl: deliveryForm.proofPhotoUrl || undefined,
        failureReason: action === "FAILED" ? deliveryForm.failureReason || undefined : undefined,
      });
      setSuccessMessage(
        action === "DELIVERED"
          ? "OTP verified successfully. Delivery completed."
          : "Delivery status updated successfully.",
      );
      setToast({
        open: true,
        severity: "success" as any,
        message: action === "DELIVERED" ? "OTP verified successfully. Delivery completed." : "Status updated successfully.",
      });
      setSelectedTask(null);
      setOtpSent(false);
      await loadWorkspace();
    } catch (requestError: any) {
      const serverMessage = requestError?.response?.data?.message || "Failed to update delivery status";
      setError(serverMessage);
      setToast({ open: true, severity: "error" as any, message: serverMessage });

      if (action === "DELIVERED" && /arrived/i.test(serverMessage)) {
        setDeliveryAction("ARRIVED");
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
      setError("Mark the order as Arrived before sending OTP.");
      return;
    }

    if (!ensureCodDetails()) {
      return;
    }

    try {
      await markConfirmationPending();
      setOtpSent(true);
      setSuccessMessage("OTP sent successfully to the customer email.");
      setDeliveryAction("DELIVERED");
      setDeliveryForm((current) => ({
        ...current,
        statusReason: current.statusReason || "OTP sent to customer email",
      }));
      await loadWorkspace();
    } catch (requestError: any) {
      if (requestError?.response?.status === 409) {
        setOtpSent(true);
        setSuccessMessage("OTP is already active. Ask the customer for the code and verify delivery.");
        setDeliveryAction("DELIVERED");
        setOtpCooldownUntil(Date.now() + OTP_COOLDOWN_SECONDS * 1000);
        setToast({ open: true, severity: "info" as any, message: "OTP already active. Enter OTP to verify." });
        setError("OTP already active for this order. Enter the customer OTP and verify delivery.");
        setDeliveryForm((current) => ({
          ...current,
          statusReason: current.statusReason || "OTP sent to customer email",
        }));
      } else {
        setError(requestError?.response?.data?.message || "Failed to send delivery OTP");
      }
    }
  };
  const handleProofUpload = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setUploadingProof(true);
    try {
      const url = await uploadToCloudinary(file);
      setDeliveryForm((current) => ({ ...current, proofPhotoUrl: url || "" }));
    } catch (uploadError: any) {
      setError(uploadError?.message || "Failed to upload proof file");
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
      setPetrolForm((current) => ({ ...current, receiptUrl: url || "" }));
    } catch (uploadError: any) {
      setError(uploadError?.message || "Failed to upload receipt file");
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
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to submit COD deposit");
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
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Failed to submit petrol claim");
    }
  };


  useEffect(() => {
    if (!otpCooldownUntil) return;
    const id = window.setInterval(() => setOtpCooldownNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [otpCooldownUntil]);

  const otpCooldownSeconds = otpCooldownUntil ? Math.max(0, Math.ceil((otpCooldownUntil - otpCooldownNow) / 1000)) : 0;
  const otpCooldownActive = otpCooldownSeconds > 0;

  const otpSlots = Array.from({ length: OTP_LENGTH }).map((_, index) => otpDigits.charAt(index));

  const setOtpAt = (index: number, digit: string) => {
    const clean = digit.replace(/\D/g, "").slice(0, 1);
    const next = otpSlots.map((value, slotIndex) => (slotIndex === index ? clean : value)).join("");
    setDeliveryForm((current) => ({ ...current, otp: next }));
    if (clean && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<any>) => {
    if (event.key !== "Backspace") return;
    if (!otpSlots[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      return;
    }
    setOtpAt(index, "");
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDeliveryForm((current) => ({ ...current, otp: pasted }));
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const renderDeliveries = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ["Assigned Today", overview.ordersToday],
          ["Delivered Today", overview.deliveredToday],
          ["Failed Today", overview.failedToday],
          ["COD Collected", formatMoney(overview.codCollected)],
        ].map(([label, value]) => (
          <Card key={String(label)} sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">{label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{value}</Typography>
            </CardContent>
          </Card>
        ))}
      </div>

      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Today's Deliveries</Typography>
            <Typography variant="body2" color="text.secondary">Follow the strict Payment to OTP to Delivery sequence for COD orders.</Typography>
          </div>
          <Button variant="outlined" onClick={loadWorkspace} disabled={loading}>Refresh</Button>
        </div>

        <div className="space-y-4">
          {activeAssignments.map((task) => (
            <div key={String(task.id)} className="rounded-3xl border border-slate-200 p-4 bg-white flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900">Order #{task.orderId}</div>
                  <div className="text-sm text-slate-500">Customer: {task.customerName}</div>
                  <div className="text-sm text-slate-500">Address: {task.address}</div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Chip size="small" label={getPaymentBadgeLabel(task)} color={statusTone(task.paymentStatus)} />
                  <Chip size="small" label={task.courierTaskStatus} color={statusTone(task.courierTaskStatus)} variant="outlined" />
                  <Chip size="small" label={task.deliveryWindow || task.etaLabel || "Today 2PM - 6PM"} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span>Shipment: {task.shipmentStatus}</span>
                <span>Amount: {formatMoney(task.amount)}</span>
                <span>OTP: {task.requiresOtp ? "Required" : "Not Required"}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="contained" onClick={() => openTask(task)}>View Details</Button>
                <Button variant="outlined" href={`tel:${task.customerPhone || ""}`} disabled={!task.customerPhone}>Call Customer</Button>
              </div>
            </div>
          ))}
          {!activeAssignments.length && <Typography color="text.secondary">No active delivery tasks right now.</Typography>}
        </div>
      </Paper>
    </div>
  );

  const renderReversePickups = (title: string, tasks: CourierAssignmentItem[], emptyState: string) => (
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">Accept pickup tasks, collect the item, upload proof, and mark the reverse task picked.</Typography>
        </div>
        <Chip label={`${tasks.length} active`} color="warning" />
      </div>
      <div className="space-y-4">
        {tasks.map((task) => {
          const picked = reversePickupCompletedStatuses.has((task.returnStatus || "").toUpperCase())
            || ["PICKED", "COMPLETED"].includes((task.reversePickupTaskStatus || "").toUpperCase());
          const accepted = isReversePickupAccepted(task);
          return (
            <div key={String(task.reverseTaskId ?? task.id)} className="rounded-3xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900">Order #{task.orderId}</div>
                  <div className="text-sm text-slate-600">Customer: {task.customerName}</div>
                  <div className="text-sm text-slate-600">Address: {task.address}</div>
                  {task.itemTitle && <div className="text-sm text-slate-500">Item: {task.itemTitle}</div>}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Chip size="small" label={task.returnStatus || (task.reverseType === "EXCHANGE" ? "EXCHANGE_PICKUP_SCHEDULED" : "RETURN_PICKUP_SCHEDULED")} color={statusTone(task.returnStatus)} />
                  <Chip size="small" label={(task.reversePickupTaskStatus || (accepted ? "ACCEPTED" : "SCHEDULED")).replace(/_/g, " ")} variant="outlined" />
                  <Chip size="small" label={task.reverseScheduledAt ? formatDateLabel(task.reverseScheduledAt) : (task.deliveryWindow || task.etaLabel || "Pickup slot pending")} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span>Request Type: {task.reverseType || "RETURN"}</span>
                <span>Amount: {formatMoney(task.amount)}</span>
                {task.returnReason && <span>Reason: {task.returnReason}</span>}
                {task.reversePickedAt && <span>Picked: {formatDateLabel(task.reversePickedAt)}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="contained" onClick={() => openReverseTask(task)}>{picked ? "View Pickup" : !accepted ? "Accept Pickup" : (task.reversePickupTaskStatus || "").toUpperCase() === "IN_PROGRESS" ? "Complete Pickup" : "Pickup Item"}</Button>
                <Button variant="outlined" href={`tel:${task.customerPhone || ""}`} disabled={!task.customerPhone}>Call Customer</Button>
                {task.proofPhotoUrl && (
                  <Button variant="text" href={task.proofPhotoUrl} target="_blank" rel="noreferrer">View Pickup Photo</Button>
                )}
              </div>
            </div>
          );
        })}
        {!tasks.length && <Typography color="text.secondary">{emptyState}</Typography>}
      </div>
    </Paper>
  );

  const renderReturnPickups = () => renderReversePickups("Return Pickups", returnPickupAssignments, "No assigned return pickups right now.");

  const renderExchangePickups = () => <CourierExchangePickupList />;

  const renderDelivered = () => (
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Delivered Orders</Typography>
          <Typography variant="body2" color="text.secondary">Completed orders move here after OTP verification and final delivery confirmation.</Typography>
        </div>
        <Chip label={`${deliveredAssignments.length} delivered`} color="success" />
      </div>
      <div className="space-y-4">
        {deliveredAssignments.map((task) => (
          <div key={String(task.id)} className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-900">Order #{task.orderId}</div>
                <div className="text-sm text-slate-600">{task.customerName} - {task.address}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="small" label={task.paymentType === "COD" ? `COD ${formatMoney(task.codAmount || task.amount)}` : "Paid Online"} color={statusTone(task.paymentStatus)} />
                <Chip size="small" label="DELIVERED" color="success" variant="outlined" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span>OTP: {task.otpVerified ? "Verified" : "Pending"}</span>
              <span>Shipment: {task.shipmentStatus}</span>
              <span>Amount: {formatMoney(task.amount)}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outlined" onClick={() => openTask(task)}>View Delivery Detail</Button>
            </div>
          </div>
        ))}
        {!deliveredAssignments.length && <Typography color="text.secondary">No delivered orders yet.</Typography>}
      </div>
    </Paper>
  );


  const renderCod = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>COD Collections</Typography>
        {codItems.map((item) => (
          <div key={String(item.id)} className="rounded-3xl border border-slate-200 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-slate-900">Order #{item.orderId}</div>
              <Chip size="small" label={item.status} color={statusTone(item.status)} />
            </div>
            <div className="text-sm text-slate-500">Mode: {item.paymentMode} - Amount: {formatMoney(item.amount)}</div>
            <div className="text-sm text-slate-500">Collected: {formatDateLabel(item.collectedAt)}</div>
          </div>
        ))}
        {!codItems.length && <Typography color="text.secondary">No COD collected yet.</Typography>}
      </Paper>

      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Submit COD Deposit</Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField size="small" label="Total Amount" value={codForm.amount} onChange={(event) => setCodForm((current) => ({ ...current, amount: event.target.value }))} />
          <FormControl size="small" fullWidth>
            <InputLabel>Deposit Mode</InputLabel>
            <Select value={codForm.mode} label="Deposit Mode" onChange={(event) => setCodForm((current) => ({ ...current, mode: event.target.value as CodCollectionMode }))}>
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="Reference Number" value={codForm.referenceId} onChange={(event) => setCodForm((current) => ({ ...current, referenceId: event.target.value }))} />
          <TextField size="small" type="date" label="Deposit Date" value={codForm.settlementDate} onChange={(event) => setCodForm((current) => ({ ...current, settlementDate: event.target.value }))} InputLabelProps={{ shrink: true }} />
        </div>
        <Button variant="contained" onClick={handleCodDepositSubmit}>Submit Deposit</Button>
      </Paper>
    </div>
  );

  const renderPetrol = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Submit Petrol Claim</Typography>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Allowance policy: {defaultSalaryConfig.petrolAllowanceType} - monthly cap {formatMoney(defaultSalaryConfig.petrolAllowanceMonthlyCap)}
        </div>
        <div className="grid grid-cols-1 gap-3">
          <TextField size="small" type="month" label="Month" value={petrolForm.claimMonth} onChange={(event) => setPetrolForm((current) => ({ ...current, claimMonth: event.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Amount" value={petrolForm.amount} onChange={(event) => setPetrolForm((current) => ({ ...current, amount: event.target.value }))} />
          <div className="rounded-2xl border border-slate-200 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Receipt Upload</Typography>
                <Typography variant="caption" color="text.secondary">Upload the petrol receipt file here.</Typography>
              </div>
              <Button variant="outlined" component="label" disabled={uploadingReceipt}>
                {uploadingReceipt ? "Uploading..." : petrolForm.receiptUrl ? "Replace Receipt" : "Upload Receipt"}
                <input hidden type="file" accept="image/*,.pdf" onChange={(event) => handleReceiptUpload(event.target.files?.[0] || null)} />
              </Button>
            </div>
            {petrolForm.receiptUrl && (
              <a className="mt-3 inline-block text-sm text-blue-600 underline" href={petrolForm.receiptUrl} target="_blank" rel="noreferrer">
                View uploaded receipt
              </a>
            )}
          </div>
          <TextField size="small" label="Notes" multiline minRows={3} value={petrolForm.notes} onChange={(event) => setPetrolForm((current) => ({ ...current, notes: event.target.value }))} />
        </div>
        <Button variant="contained" onClick={handlePetrolClaimSubmit}>Submit Claim</Button>
      </Paper>

      <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Petrol Claim History</Typography>
        {petrolClaims.map((claim) => (
          <div key={String(claim.id)} className="rounded-3xl border border-slate-200 p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">{claim.month}</div>
              <div className="text-sm text-slate-500">{formatMoney(claim.amount)}</div>
            </div>
            <Chip size="small" label={claim.status} color={statusTone(claim.status)} />
          </div>
        ))}
        {!petrolClaims.length && <Typography color="text.secondary">No petrol claims submitted yet.</Typography>}
      </Paper>
    </div>
  );

  const renderEarnings = () => (
    <Paper className="p-5 rounded-3xl border border-slate-200 shadow-none space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Monthly Earnings</Typography>
          <Typography variant="body2" color="text.secondary">Base salary + deliveries + petrol + incentives - penalties</Typography>
        </div>
        <TextField size="small" label="Month" value={month} onChange={(event) => setMonth(event.target.value)} />
      </div>
      {earnings ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ["Base Salary", formatMoney(earnings.baseSalary)],
            ["Per Delivery Earnings", formatMoney(earnings.perDeliveryEarnings)],
            ["Petrol Allowance", formatMoney(earnings.petrolAllowanceApproved)],
            ["Deliveries", `${earnings.deliveriesCount} x ${formatMoney(earnings.perDeliveryRate)}`],
            ["Incentive", formatMoney(earnings.incentiveAmount)],
            ["Penalties", `- ${formatMoney(earnings.penalties)}`],
            ["COD Pending", formatMoney(earnings.codPending)],
            ["Total Payable", formatMoney(earnings.totalPayable)],
          ].map(([label, value]) => (
            <Card key={String(label)} sx={{ borderRadius: 4, boxShadow: "none", border: "1px solid #e2e8f0" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">{label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{value}</Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Typography color="text.secondary">No earnings snapshot available.</Typography>
      )}
    </Paper>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((current) => ({ ...current, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>Courier Workspace</Typography>
            <Typography variant="body2" color="text.secondary">Assigned orders, COD deposits, petrol claims and earnings in one flow.</Typography>
          </div>
          <Button variant="outlined" onClick={loadWorkspace} disabled={loading}>Refresh</Button>
        </div>

        {error && <Alert severity="error">{error}</Alert>}

        <Paper className="rounded-3xl border border-slate-200 shadow-none overflow-hidden">
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto">
            <Tab value="deliveries" label="Deliveries" />
            <Tab value="returnPickups" label="Return Pickups" />
            <Tab value="exchangePickups" label="Exchange Pickups" />
            <Tab value="delivered" label="Delivered Orders" />
            <Tab value="cod" label="COD" />
            <Tab value="petrol" label="Petrol" />
            <Tab value="earnings" label="Earnings" />
          </Tabs>
        </Paper>

        {activeTab === "deliveries" && renderDeliveries()}
        {activeTab === "returnPickups" && renderReturnPickups()}
        {activeTab === "exchangePickups" && renderExchangePickups()}
        {activeTab === "delivered" && renderDelivered()}
        {activeTab === "cod" && renderCod()}
        {activeTab === "petrol" && renderPetrol()}
        {activeTab === "earnings" && renderEarnings()}
      </div>

      <Dialog open={Boolean(selectedReverseTask)} onClose={closeReverseTask} fullWidth maxWidth="sm">
        <DialogTitle>{selectedReverseTask?.reverseType === "EXCHANGE" ? "Exchange Pickup" : "Return Pickup"}</DialogTitle>
        <DialogContent>
          {selectedReverseTask && (() => {
            const picked = reversePickupCompletedStatuses.has((selectedReverseTask.returnStatus || "").toUpperCase())
              || ["PICKED", "COMPLETED"].includes((selectedReverseTask.reversePickupTaskStatus || "").toUpperCase());
            const accepted = isReversePickupAccepted(selectedReverseTask);
            const inProgress = isReversePickupInProgress(selectedReverseTask);
            const scheduledLabel = selectedReverseTask.reverseScheduledAt
              ? formatDateLabel(selectedReverseTask.reverseScheduledAt)
              : selectedReverseTask.deliveryWindow || selectedReverseTask.etaLabel || "Pickup slot pending";

            return (
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 p-4">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Customer Details</Typography>
                    <div className="mt-2 text-sm text-slate-600 space-y-1">
                      <div>{selectedReverseTask.customerName}</div>
                      <div>{selectedReverseTask.customerPhone || "Phone unavailable"}</div>
                      <div>{selectedReverseTask.address}</div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-4">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Pickup Info</Typography>
                    <div className="mt-2 text-sm text-slate-600 space-y-1">
                      <div>Type: {selectedReverseTask.reverseType || "RETURN"}</div>
                      <div>Status: {selectedReverseTask.returnStatus || "PICKUP_SCHEDULED"}</div>
                      <div>Pickup Slot: {scheduledLabel}</div>
                      <div>Item: {selectedReverseTask.itemTitle || "Order item"}</div>
                    </div>
                  </div>
                </div>

                {selectedReverseTask.returnReason && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
                    Return reason: {selectedReverseTask.returnReason}
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Pickup Proof</Typography>
                      <Typography variant="body2" color="text.secondary">Upload a photo of the collected item before completing pickup.</Typography>
                    </div>
                    <Button variant="outlined" component="label" disabled={uploadingReverseProof || picked}>
                      {uploadingReverseProof ? "Uploading..." : reversePickupForm.proofPhotoUrl ? "Replace Pickup Photo" : "Upload Pickup Photo"}
                      <input hidden type="file" accept="image/*,.pdf" onChange={(event) => handleReverseProofUpload(event.target.files?.[0] || null)} />
                    </Button>
                  </div>
                  {reversePickupForm.proofPhotoUrl && (
                    <a className="inline-block text-sm text-blue-600 underline" href={reversePickupForm.proofPhotoUrl} target="_blank" rel="noreferrer">
                      View uploaded pickup proof
                    </a>
                  )}
                  <TextField
                    size="small"
                    label="Pickup Note"
                    value={reversePickupForm.note}
                    onChange={(event) => setReversePickupForm((current) => ({ ...current, note: event.target.value }))}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Flow: Accept pickup, collect the item from the customer, upload proof, then mark the item picked so the reverse status moves forward.
                </div>

                {picked && <Alert severity="success">Pickup already completed for this request.</Alert>}
              </div>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReverseTask}>Close</Button>
          {selectedReverseTask && !isReversePickupAccepted(selectedReverseTask) && !reversePickupCompletedStatuses.has((selectedReverseTask.returnStatus || "").toUpperCase()) && (
            <Button variant="outlined" onClick={handleAcceptReversePickup} disabled={submittingReversePickup}>
              {submittingReversePickup ? "Updating..." : "Accept Pickup"}
            </Button>
          )}
          {selectedReverseTask && isReversePickupAccepted(selectedReverseTask) && !isReversePickupInProgress(selectedReverseTask) && !reversePickupCompletedStatuses.has((selectedReverseTask.returnStatus || "").toUpperCase()) && (
            <Button variant="outlined" onClick={handleStartReversePickup} disabled={submittingReversePickup}>
              {submittingReversePickup ? "Updating..." : "Pickup Item"}
            </Button>
          )}
          {selectedReverseTask && !reversePickupCompletedStatuses.has((selectedReverseTask.returnStatus || "").toUpperCase()) && (
            <Button variant="contained" onClick={handleReversePickupSubmit} disabled={submittingReversePickup || uploadingReverseProof}>
              {submittingReversePickup ? "Updating..." : "Mark Item Picked"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selectedTask)} onClose={() => { setSelectedTask(null); setOtpSent(false); setSuccessMessage(null); }} fullWidth maxWidth="md">
        <DialogTitle>Delivery Task</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Customer Details</Typography>
                  <div className="mt-2 text-sm text-slate-600 space-y-1">
                    <div>{selectedTask.customerName}</div>
                    <div>{selectedTask.customerPhone || "Phone unavailable"}</div>
                    <div>{selectedTask.address}</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 p-4">
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Order Info</Typography>
                  <div className="mt-2 text-sm text-slate-600 space-y-1">
                    <div>Amount: {formatMoney(selectedTask.amount)}</div>
                    <div>Payment Type: {selectedTask.paymentType}</div>
                    <div>Delivery Slot: {selectedTask.deliveryWindow || selectedTask.etaLabel || "Today"}</div>
                    <div>Status: {selectedTask.courierTaskStatus}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormControl fullWidth size="small">
                  <InputLabel>Update Delivery Status</InputLabel>
                  <Select value={safeDeliveryAction} label="Update Delivery Status" onChange={(event) => { setSuccessMessage(null); setDeliveryAction(String(event.target.value)); }}>
                    {transitionOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Select <strong>Delivered</strong> first. After that only OTP and COD payment inputs will open.
                </div>
              </div>

              {isConfirmationStep && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="outlined" onClick={handleSendDeliveryOtp} sx={{ minWidth: 120 }} disabled={!isArrivedOrBeyond ? true : otpCooldownActive}>
                        {otpCooldownActive ? `Resend in ${otpCooldownSeconds}s` : otpSent ? "Resend OTP" : "Send OTP"}
                      </Button>
                      {(otpSent || otpVerified) && (
                        <Chip
                          icon={otpVerified ? <VerifiedOutlinedIcon /> : <MarkEmailReadOutlinedIcon />}
                          color="success"
                          variant="outlined"
                          label={otpVerified ? "Email OTP Verified" : "OTP Sent to Customer Email"}
                        />
                      )}
                    </div>
                    {otpSent && (
                      <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Customer OTP</Typography>
                            {otpVerified ? (
                              <CheckCircleOutlinedIcon color="success" fontSize="small" />
                            ) : otpError ? (
                              <ErrorOutlineOutlinedIcon color="error" fontSize="small" />
                            ) : otpLooksEntered ? (
                              <VerifiedOutlinedIcon color="action" fontSize="small" />
                            ) : null}
                          </div>
                          <div className="mt-2 grid grid-cols-6 gap-2">
                            {otpSlots.map((digit, index) => (
                              <TextField
                                key={index}
                                size="small"
                                value={digit}
                                error={otpError}
                                inputRef={(el) => { otpRefs.current[index] = el; }}
                                onPaste={handleOtpPaste}
                                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                onChange={(event) => {
                                  setError((current) => (/otp/i.test(current || "") ? null : current));
                                  setOtpAt(index, event.target.value);
                                }}
                                inputProps={{
                                  inputMode: "numeric",
                                  pattern: "[0-9]*",
                                  maxLength: 1,
                                  style: { textAlign: "center" },
                                }}
                              />
                            ))}
                          </div>
                          <Typography className="mt-2" variant="caption" color={otpError ? "error" : "text.secondary"}>
                            {otpVerified
                              ? "OTP verified successfully."
                              : otpError
                                ? error
                                : !isArrivedOrBeyond
                                  ? "Mark the order as Arrived first, then send OTP."
                                  : "Enter the 6-digit OTP from customer email, then click Verify OTP."}
                          </Typography>
                        </div>
                        <Button variant="contained" onClick={() => handleDeliverySubmit("DELIVERED")} disabled={verifyingOtp || !deliveryForm.otp.trim() || !isArrivedOrBeyond}>
                          {verifyingOtp ? "Verifying OTP..." : "Verify OTP"}
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
                    Step 1: Mark the order Arrived. Step 2: Select Delivered. Step 3: Send OTP. Step 4: Enter OTP. Step 5: Verify OTP and complete delivery.
                  </div>
                </div>
              )}
              {selectedTask.paymentType === "COD" && isConfirmationStep && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>COD Collection</Typography>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField size="small" label="COD Amount" value={deliveryForm.codAmount} onChange={(event) => setDeliveryForm((current) => ({ ...current, codAmount: event.target.value }))} />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Payment Type</InputLabel>
                      <Select
                        value={deliveryForm.codMode}
                        label="Payment Type"
                        onChange={(event) =>
                          setDeliveryForm((current) => ({
                            ...current,
                            codMode: event.target.value as CodCollectionMode,
                            transactionId: event.target.value === "UPI" ? current.transactionId : "",
                            proofPhotoUrl: event.target.value === "UPI" ? current.proofPhotoUrl : "",
                          }))
                        }
                      >
                        {paymentModeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {deliveryForm.codMode === "UPI" ? (
                      <TextField size="small" label="Transaction ID" value={deliveryForm.transactionId} onChange={(event) => setDeliveryForm((current) => ({ ...current, transactionId: event.target.value }))} />
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                        Cash payment selected. Transaction ID and screenshot are not required.
                      </div>
                    )}
                  </div>
                  {deliveryForm.codMode === "UPI" && (
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Online Payment Screenshot</Typography>
                          <Typography variant="caption" color="text.secondary">Upload screenshot when payment type is Online.</Typography>
                        </div>
                        <Button variant="outlined" component="label" disabled={uploadingProof}>
                          {uploadingProof ? "Uploading..." : deliveryForm.proofPhotoUrl ? "Replace Screenshot" : "Upload Screenshot"}
                          <input hidden type="file" accept="image/*,.pdf" onChange={(event) => handleProofUpload(event.target.files?.[0] || null)} />
                        </Button>
                      </div>
                      {deliveryForm.proofPhotoUrl && (
                        <a className="mt-3 inline-block text-sm text-blue-600 underline" href={deliveryForm.proofPhotoUrl} target="_blank" rel="noreferrer">
                          View uploaded screenshot
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormControl size="small" fullWidth>
                  <InputLabel>Status Reason</InputLabel>
                  <Select
                    value={safeSelectedReasonValue}
                    label="Status Reason"
                    onChange={(event) => setDeliveryForm((current) =>
                      deliveryAction === "FAILED"
                        ? ({ ...current, failureReason: String(event.target.value) })
                        : ({ ...current, statusReason: String(event.target.value) })
                    )}
                  >
                    {currentReasonOptions.map((reason) => (
                      <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" label="Remark / Note" value={deliveryForm.statusNote} onChange={(event) => setDeliveryForm((current) => ({ ...current, statusNote: event.target.value }))} />
              </div>

              {successMessage && <Alert severity="success">{successMessage}</Alert>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isConfirmationStep && selectedTask.paymentType !== "COD" ? (
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Delivery Proof Photo</Typography>
                        <Typography variant="caption" color="text.secondary">Optional proof for delivered prepaid orders.</Typography>
                      </div>
                      <Button variant="outlined" component="label" disabled={uploadingProof}>
                        {uploadingProof ? "Uploading..." : deliveryForm.proofPhotoUrl ? "Replace Photo" : "Upload Photo"}
                        <input hidden type="file" accept="image/*,.pdf" onChange={(event) => handleProofUpload(event.target.files?.[0] || null)} />
                      </Button>
                    </div>
                    {deliveryForm.proofPhotoUrl && (
                      <a className="mt-3 inline-block text-sm text-blue-600 underline" href={deliveryForm.proofPhotoUrl} target="_blank" rel="noreferrer">
                        View uploaded proof
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    Proof input opens here only when the Delivered flow needs it.
                  </div>
                )}
                <TextField size="small" label="Failure Reason" value={deliveryForm.failureReason} onChange={(event) => setDeliveryForm((current) => ({ ...current, failureReason: event.target.value }))} helperText="Required only when marking failed delivery" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Updated flow: Delivered click first sends Order Confirmation OTP to customer email. Final completion happens only after OTP verification. COD orders must confirm payment before OTP.
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSelectedTask(null); setOtpSent(false); setSuccessMessage(null); }}>Close</Button>
          {!isConfirmationStep && (
            <Button variant="contained" onClick={() => handleDeliverySubmit()} disabled={verifyingOtp}>{verifyingOtp ? "Verifying OTP..." : "Save Update"}</Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CourierDashboard;


















































