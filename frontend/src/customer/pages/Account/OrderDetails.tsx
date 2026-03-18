import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import OrderItem from "./OrderItem";
import OrderStepper from "./OrderStepper";
import ReturnRefundForm from "./components/ReturnRefundForm";
import RefundStatusPanel from "./components/RefundStatusPanel";
import ExchangeRequestForm from "./components/ExchangeRequestForm";
import ExchangeDetailsPage from "./components/ExchangeDetailsPage";
import BalanceSelectionForm from "./components/BalanceSelectionForm";
import BankDetailsForm from "./components/BankDetailsForm";
import {
  cancelOrder,
  orderById,
  orderCancelReasons,
  orderItemById,
  userOrderHistory,
} from "../../../State/Backend/MasterApiThunks";
import {
  clearExchangeError,
  clearExchangeSuccess,
  createExchangeRequest,
  ExchangeRequestRecord,
  fetchExchangeRequests,
  hasActiveExchange,
  selectExchangeBalanceMode,
  selectLatestExchangeForItem,
  submitDifferencePayment,
  submitExchangeBankDetails,
} from "State/Exchange/exchangeSlice";
import { useAppDispatch, useAppSelector } from "app/store/Store";
import { buildTrackingMilestones, statusTone } from "modules/courier/courierData";
import { api } from "shared/api/Api";

type ProductLite = { id: number; title?: string; description?: string; images?: string[] };
type OrderItemLite = { id: number; product?: ProductLite; size?: string; quantity?: number };
type AddressLite = { name?: string; address?: string; locality?: string; city?: string; state?: string; pinCode?: string; mobileNumber?: string };
type CourierLite = { fullName?: string; name?: string; phone?: string };
type DeliveryHistoryLite = { id?: number; status?: string; reason?: string; note?: string; proofUrl?: string; updatedBy?: string; updatedAt?: string };

type OrderLite = {
  id: number;
  orderStatus?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  shipmentStatus?: string;
  deliveryTaskStatus?: string;
  deliveryStatusReason?: string;
  deliveryStatusNote?: string;
  cancelReasonCode?: string;
  cancelReasonText?: string;
  cancelledAt?: string;
  shippingAddress?: AddressLite;
  orderItems?: OrderItemLite[];
  estimatedDelivery?: string;
  deliveryWindow?: string;
  courier?: CourierLite;
  courierName?: string;
  courierPhone?: string;
  deliveryHistory?: DeliveryHistoryLite[];
  deliveryDate?: string;
};

type CancelReasonOption = { code: string; label: string };

const cancelAllowed = new Set(["PENDING", "PLACED", "CONFIRMED"]);
const prettyLabel = (value?: string | null) => (value || "").replaceAll("_", " ");

const resolveCustomerStatus = (order: OrderLite | null) => {
  const rawOrderStatus = (order?.orderStatus || "PENDING").toUpperCase();
  const shipmentStatus = (order?.shipmentStatus || rawOrderStatus).toUpperCase();
  const deliveryTaskStatus = (order?.deliveryTaskStatus || "").toUpperCase();

  if (rawOrderStatus === "CANCELLED") return "CANCELLED";
  if (shipmentStatus === "DELIVERED" || rawOrderStatus === "DELIVERED") return "DELIVERED";
  if (deliveryTaskStatus === "CONFIRMATION_PENDING") return "CONFIRMATION_PENDING";
  if (deliveryTaskStatus === "ARRIVED") return "ARRIVED_AT_LOCATION";
  if (shipmentStatus === "OUT_FOR_DELIVERY") return "OUT_FOR_DELIVERY";
  if (["IN_TRANSIT", "HANDED_TO_COURIER"].includes(shipmentStatus)) return "SHIPPED";
  if ((order?.fulfillmentStatus || "").toUpperCase() === "FULFILLED") return "PACKED";
  return rawOrderStatus;
};

const OrderDetails = () => {
  const params = useParams();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, responses } = useAppSelector((state) => state.masterApi);
  const {
    requests: exchangeRequests,
    loading: exchangeLoading,
    actionLoading: exchangeActionLoading,
    error: exchangeError,
    successMessage: exchangeSuccess,
  } = useAppSelector((state) => state.exchange);

  const [returnRefundRequests, setReturnRefundRequests] = useState<any[]>([]);
  const [returnRefundLoading, setReturnRefundLoading] = useState(false);
  const [returnRefundSubmitting, setReturnRefundSubmitting] = useState(false);
  const [returnRefundError, setReturnRefundError] = useState<string | null>(null);
  const [returnRefundOpen, setReturnRefundOpen] = useState(false);
  const [exchangeFormOpen, setExchangeFormOpen] = useState(false);
  const [balanceFormOpen, setBalanceFormOpen] = useState(false);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [differenceDialogOpen, setDifferenceDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

  const { resolvedOrderId, resolvedOrderItemId } = useMemo(() => {
    const directOrderId = (params as any).orderId as string | undefined;
    const directOrderItemId = (params as any).orderItemId as string | undefined;
    if (directOrderId) {
      return { resolvedOrderId: directOrderId, resolvedOrderItemId: directOrderItemId };
    }
    const splat = (params as any)["*"] as string | undefined;
    const source = splat && splat.length > 0 ? splat : location.pathname.replace(/^\/account\//, "");
    const parts = source.split("/").filter(Boolean);
    if (parts[0] !== "orders") {
      return { resolvedOrderId: undefined, resolvedOrderItemId: undefined };
    }
    return { resolvedOrderId: parts[1], resolvedOrderItemId: parts[2] };
  }, [location.pathname, params]);

  const initialSuccessMessage =
    typeof (location.state as { successMessage?: string } | null)?.successMessage === "string"
      ? (location.state as { successMessage?: string }).successMessage || null
      : null;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const [cancelReasonText, setCancelReasonText] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(initialSuccessMessage);

  const order = (responses.orderById || null) as OrderLite | null;
  const selectedItem = (responses.orderItemById || null) as OrderItemLite | null;
  const cancelReasonOptions = useMemo<CancelReasonOption[]>(() => {
    const data: any = responses.orderCancelReasons;
    const rawList = Array.isArray(data) ? data : Array.isArray(data?.reasons) ? data.reasons : [];
    const parsed = rawList
      .map((reason: any) => {
        if (typeof reason === "string") return { code: reason, label: reason };
        const code = reason?.code || reason?.reasonCode || reason?.value || reason?.id;
        const label = reason?.label || reason?.reason || reason?.title || reason?.name || code;
        if (!code) return null;
        return { code: String(code), label: String(label || code) };
      })
      .filter(Boolean) as CancelReasonOption[];
    if (parsed.length) return parsed;
    return [
      { code: "ORDERED_BY_MISTAKE", label: "Ordered by mistake" },
      { code: "FOUND_BETTER_PRICE", label: "Found better price elsewhere" },
      { code: "DELIVERY_TOO_LATE", label: "Delivery is taking too long" },
      { code: "CHANGED_MY_MIND", label: "Changed my mind" },
      { code: "OTHER", label: "Other" },
    ];
  }, [responses.orderCancelReasons]);

  const loadReturnRefundRequests = async () => {
    setReturnRefundLoading(true);
    setReturnRefundError(null);
    try {
      const response = await api.get("/api/orders/returns");
      setReturnRefundRequests(Array.isArray(response.data) ? response.data : []);
    } catch (requestError: any) {
      setReturnRefundError(requestError?.response?.data?.message || "Failed to load return refund requests");
    } finally {
      setReturnRefundLoading(false);
    }
  };

  const handleSubmitReturnRefund = async (payload: {
    returnReason: string;
    comment?: string;
    productPhoto?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
  }) => {
    if (!item?.id) return;
    setReturnRefundSubmitting(true);
    setReturnRefundError(null);
    try {
      await api.post("/api/orders/returns/items/" + item.id, {
        returnReason: payload.returnReason,
        comment: payload.comment,
        productPhoto: payload.productPhoto,
        refundDetails: {
          accountHolderName: payload.accountHolderName,
          accountNumber: payload.accountNumber,
          ifscCode: payload.ifscCode,
          bankName: payload.bankName,
          upiId: payload.upiId,
        },
      });
      setReturnRefundOpen(false);
      await loadReturnRefundRequests();
    } catch (requestError: any) {
      setReturnRefundError(requestError?.response?.data?.message || "Failed to submit return request");
    } finally {
      setReturnRefundSubmitting(false);
    }
  };

  useEffect(() => {
    if (!resolvedOrderId) return;

    const loadOrder = () => {
      dispatch(orderById(resolvedOrderId));
      dispatch(userOrderHistory());
      dispatch(fetchExchangeRequests());
      loadReturnRefundRequests();
      if (resolvedOrderItemId) dispatch(orderItemById(resolvedOrderItemId));
    };

    loadOrder();
    dispatch(orderCancelReasons());

    const intervalId = window.setInterval(loadOrder, 20000);
    const handleFocus = () => loadOrder();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [dispatch, resolvedOrderId, resolvedOrderItemId]);

  useEffect(() => () => {
    dispatch(clearExchangeError());
    dispatch(clearExchangeSuccess());
  }, [dispatch]);

  const item = useMemo(() => {
    if (selectedItem) return selectedItem;
    if (!order) return null;
    if (!resolvedOrderItemId) return (order.orderItems || [])[0] || null;
    return (order.orderItems || []).find((entry) => String(entry.id) === String(resolvedOrderItemId)) || (order.orderItems || [])[0] || null;
  }, [selectedItem, order, resolvedOrderItemId]);

  const latestExchangeRequest = useMemo(
    () => selectLatestExchangeForItem(exchangeRequests, item?.id),
    [exchangeRequests, item?.id],
  );

  const latestReturnRefundRequest = useMemo(() => (
    returnRefundRequests
      .filter((entry) => String(entry.orderItemId) === String(item?.id || ""))
      .sort((left, right) => new Date(right.requestedAt || 0).getTime() - new Date(left.requestedAt || 0).getTime())[0] || null
  ), [item?.id, returnRefundRequests]);

  const hasActiveReturnRefundRequest = latestReturnRefundRequest
    ? !["REFUND_COMPLETED", "RETURN_REJECTED"].includes((latestReturnRefundRequest.status || "").toUpperCase())
    : false;

  const rawOrderStatus = (order?.orderStatus || "PENDING").toUpperCase();
  const shipmentStatus = (order?.shipmentStatus || rawOrderStatus).toUpperCase();
  const deliveryTaskStatus = (order?.deliveryTaskStatus || "").toUpperCase();
  const pendingReason = order?.deliveryStatusReason || "";
  const sanitizedPendingReason = /verified|delivered/i.test(pendingReason) ? "" : pendingReason;
  const customerStatus = resolveCustomerStatus(order);
  const canCancel = cancelAllowed.has(rawOrderStatus);
  const courierName = order?.courier?.fullName || order?.courier?.name || order?.courierName;
  const courierPhone = order?.courier?.phone || order?.courierPhone;
  const trackingSteps = buildTrackingMilestones({
    orderStatus: rawOrderStatus,
    fulfillmentStatus: order?.fulfillmentStatus,
    shipmentStatus,
  });
  const showCourierCard = ["OUT_FOR_DELIVERY", "DELIVERED", "ARRIVED", "CONFIRMATION_PENDING"].includes(shipmentStatus) || deliveryTaskStatus === "CONFIRMATION_PENDING";
  const deliveryDateMs = order?.deliveryDate ? new Date(order.deliveryDate).getTime() : 0;
  const deliveredWithin48Hours = customerStatus === "DELIVERED" && deliveryDateMs > 0 && Date.now() - deliveryDateMs <= 48 * 60 * 60 * 1000;
  const canRequestReturnRefund = deliveredWithin48Hours && !!item?.id && !hasActiveReturnRefundRequest;
  const canRequestExchange = deliveredWithin48Hours && !!item?.id && !hasActiveExchange(latestExchangeRequest);
  const productOptions = useMemo(() => {
    const options = new Map<string, { id: number | string; title: string }>();
    if (item?.product?.id) {
      options.set(String(item.product.id), { id: item.product.id, title: item.product.title || "Current Product" });
    }
    (order?.orderItems || []).forEach((entry) => {
      if (entry.product?.id) {
        options.set(String(entry.product.id), { id: entry.product.id, title: entry.product.title || `Product ${entry.product.id}` });
      }
    });
    return Array.from(options.values());
  }, [item?.product?.id, item?.product?.title, order?.orderItems]);

  const handleCancelOrder = async () => {
    if (!resolvedOrderId || !selectedCancelReason) return;
    try {
      await dispatch(cancelOrder({
        orderId: resolvedOrderId,
        cancelReasonCode: selectedCancelReason,
        cancelReasonText: cancelReasonText.trim() || undefined,
      })).unwrap();
      setCancelSuccess("Order cancelled successfully.");
      setCancelDialogOpen(false);
      dispatch(orderById(resolvedOrderId));
      dispatch(userOrderHistory());
    } catch (cancelError) {
      console.error("Cancellation failed", cancelError);
    }
  };

  const handleCreateExchange = async (payload: {
    exchangeReason: string;
    comment?: string;
    productPhoto?: string;
    requestedVariant?: string;
    requestedNewProductId: number | string;
  }) => {
    if (!item?.id) return;
    await dispatch(createExchangeRequest({ orderItemId: item.id, ...payload })).unwrap();
    setExchangeFormOpen(false);
    dispatch(fetchExchangeRequests());
  };

  const handleDifferencePayment = async () => {
    if (!latestExchangeRequest?.id || !paymentReference.trim()) return;
    await dispatch(submitDifferencePayment({ requestId: latestExchangeRequest.id, paymentReference: paymentReference.trim() })).unwrap();
    setDifferenceDialogOpen(false);
    setPaymentReference("");
    dispatch(fetchExchangeRequests());
  };

  const handleBalanceMode = async (balanceMode: "WALLET" | "BANK_TRANSFER") => {
    if (!latestExchangeRequest?.id) return;
    await dispatch(selectExchangeBalanceMode({ requestId: latestExchangeRequest.id, balanceMode })).unwrap();
    setBalanceFormOpen(false);
    dispatch(fetchExchangeRequests());
  };

  const handleBankDetails = async (payload: { accountHolderName?: string; accountNumber?: string; ifscCode?: string; bankName?: string; upiId?: string }) => {
    if (!latestExchangeRequest?.id || !payload.accountHolderName || !payload.accountNumber || !payload.ifscCode || !payload.bankName) return;
    await dispatch(submitExchangeBankDetails({ requestId: latestExchangeRequest.id, accountHolderName: payload.accountHolderName, accountNumber: payload.accountNumber, ifscCode: payload.ifscCode, bankName: payload.bankName, upiId: payload.upiId })).unwrap();
    setBankFormOpen(false);
    dispatch(fetchExchangeRequests());
  };

  if (loading && !order) {
    return (
      <div className="py-20 flex justify-center">
        <CircularProgress thickness={2} />
      </div>
    );
  }

  if (error && !order) return <Alert severity="error" className="rounded-xl">{error}</Alert>;
  if (!order) return <Alert severity="warning" className="rounded-xl">Order not found.</Alert>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Tracking</h1>
          <p className="text-gray-500 text-sm font-medium">Tracking now follows fulfillment, shipment, refund and exchange states together.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip label={customerStatus.replaceAll("_", " ")} color={statusTone(customerStatus)} sx={{ fontWeight: "bold", borderRadius: "8px" }} />
          <Chip label={order.paymentStatus || "PENDING"} color={statusTone(order.paymentStatus)} variant="outlined" sx={{ borderRadius: "8px" }} />
          {latestExchangeRequest?.status && (
            <Chip label={prettyLabel(latestExchangeRequest.status)} color={statusTone(latestExchangeRequest.status)} variant="outlined" sx={{ borderRadius: "8px", fontWeight: 700 }} />
          )}
        </div>
      </div>

      {cancelSuccess && <Alert severity="success">{cancelSuccess}</Alert>}
      {exchangeSuccess && <Alert severity="success" onClose={() => dispatch(clearExchangeSuccess())}>{exchangeSuccess}</Alert>}
      {exchangeError && <Alert severity="error" onClose={() => dispatch(clearExchangeError())}>{exchangeError}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">
        <div className="p-4 border rounded-2xl bg-white shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
            <HomeIcon className="text-blue-600" sx={{ fontSize: 20 }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-bold uppercase text-[10px] tracking-widest text-gray-400">Delivery Address</h2>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <p className="text-[11px] font-bold text-blue-600 truncate">{order.shippingAddress?.mobileNumber || "N/A"}</p>
            </div>
            <p className="font-black text-gray-900 text-sm leading-tight mb-0.5">{order.shippingAddress?.name || "N/A"}</p>
            <p className="text-gray-500 text-xs truncate leading-relaxed">
              {order.shippingAddress?.address}, {order.shippingAddress?.locality}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - <span className="font-bold text-gray-700">{order.shippingAddress?.pinCode}</span>
            </p>
          </div>
        </div>

        <div className="p-4 border rounded-2xl bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
            Delivery Promise
          </div>
          <div className="text-sm font-semibold text-gray-900">{order.deliveryWindow || order.estimatedDelivery || "Today by 6 PM"}</div>
          <div className="text-xs text-gray-500">Timeline: {trackingSteps.filter((step) => step.completed).length}/{trackingSteps.length} milestones complete</div>
          {(returnRefundLoading || exchangeLoading) && <div className="text-xs text-gray-500">Checking refund and exchange updates...</div>}
        </div>
      </div>

      <div className="p-8 border rounded-2xl bg-white shadow-sm space-y-6">
        <div>
          <h2 className="text-center font-bold uppercase text-xs tracking-[0.2em] text-gray-400 mb-10">Order Journey</h2>
          <OrderStepper orderStatus={rawOrderStatus} fulfillmentStatus={order.fulfillmentStatus} shipmentStatus={shipmentStatus} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {trackingSteps.map((step) => (
            <div key={step.key} className={`rounded-2xl border px-4 py-3 text-center ${step.active ? "border-black bg-black text-white" : step.completed ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">{step.completed ? "Done" : step.active ? "Current" : "Pending"}</div>
              <div className="text-sm font-semibold mt-1">{step.label}</div>
            </div>
          ))}
        </div>

        {latestReturnRefundRequest && <RefundStatusPanel request={latestReturnRefundRequest} />}
        {returnRefundError && !returnRefundOpen && <Alert severity="error">{returnRefundError}</Alert>}
        {latestExchangeRequest && (
          <ExchangeDetailsPage
            request={latestExchangeRequest as ExchangeRequestRecord}
            onPayDifference={() => setDifferenceDialogOpen(true)}
            onSelectBalanceMode={() => setBalanceFormOpen(true)}
            onSubmitBankDetails={() => setBankFormOpen(true)}
          />
        )}

        {deliveryTaskStatus === "CONFIRMATION_PENDING" && (
          <Alert severity="warning">
            Delivery confirmation pending. OTP has been sent to your registered email.{sanitizedPendingReason ? ` ${sanitizedPendingReason}` : ""}
          </Alert>
        )}

        {!!order.deliveryHistory?.length && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Delivery Status History</div>
            <div className="space-y-3">
              {order.deliveryHistory.map((entry) => (
                <div key={entry.id || `${entry.status}-${entry.updatedAt}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="font-semibold text-slate-900 text-sm">{(entry.status || "UPDATE").replaceAll("_", " ")}</div>
                    <div className="text-xs text-slate-500">{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : "-"}</div>
                  </div>
                  {(entry.reason || entry.note) && (
                    <div className="mt-2 text-sm text-slate-600">
                      {entry.reason && <div>Reason: {entry.reason}</div>}
                      {entry.note && <div>Note: {entry.note}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showCourierCard && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <LocalShippingOutlinedIcon className="text-slate-700" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Courier Info</div>
                <div className="text-sm font-semibold text-slate-900">{courierName || "Assigned courier will appear here"}</div>
                <div className="text-sm text-slate-500">Phone: {courierPhone || "98xxxxxxx"}</div>
                {order.deliveryStatusReason && <div className="text-xs text-slate-500 mt-1">Latest Update: {order.deliveryStatusReason}</div>}
              </div>
            </div>
            <div className="text-sm text-slate-600">
              Expected Delivery: <span className="font-semibold text-slate-900">{order.deliveryWindow || order.estimatedDelivery || "Today 6PM"}</span>
            </div>
          </div>
        )}

        {rawOrderStatus === "CANCELLED" && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
            <p className="font-bold uppercase text-[10px] tracking-wider mb-1">Reason for Cancellation</p>
            <p className="font-medium">{order.cancelReasonCode || "N/A"}</p>
            {(order.cancelReasonText || order.deliveryStatusReason) && <p className="mt-1 opacity-80">{order.cancelReasonText || order.deliveryStatusReason}</p>}
            {order.cancelledAt && <p className="mt-1 opacity-80">Cancelled At: {new Date(order.cancelledAt).toLocaleString()}</p>}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-black text-gray-900 text-xl ml-1">Products Info</h2>
        <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID: #{order.id}</span>
            <span className="text-xs font-bold text-blue-600">{customerStatus.replaceAll("_", " ")}</span>
          </div>
          <div className="p-2">
            {item ? (
              <OrderItem
                id={item.id}
                orderId={order.id}
                title={item.product?.title || "Product"}
                description={item.product?.description}
                size={item.size}
                image={item.product?.images?.[0]}
                orderStatus={customerStatus}
              />
            ) : (
              <p className="text-sm text-gray-500 p-6 text-center italic">No order item details available.</p>
            )}
          </div>
        </div>
      </div>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {canRequestReturnRefund && (
          <Button fullWidth variant="contained" onClick={() => setReturnRefundOpen(true)} sx={{ borderRadius: "12px", py: 1.5, fontWeight: 800, boxShadow: "none", bgcolor: "#111827", "&:hover": { bgcolor: "#000000" } }}>
            Return & Refund
          </Button>
        )}
        {canRequestExchange && (
          <Button fullWidth variant="outlined" onClick={() => setExchangeFormOpen(true)} sx={{ borderRadius: "12px", py: 1.5, fontWeight: 800, borderColor: "#d1d5db", color: "#111827", "&:hover": { borderColor: "#111827", bgcolor: "#f9fafb" } }}>
            Exchange
          </Button>
        )}
      </Stack>

      {latestReturnRefundRequest && !canRequestReturnRefund && hasActiveReturnRefundRequest && (
        <Alert severity="info">Return & Refund request is currently in progress for this item.</Alert>
      )}
      {latestExchangeRequest && hasActiveExchange(latestExchangeRequest) && (
        <Alert severity="info">Exchange request is currently in progress for this item.</Alert>
      )}
      {customerStatus === "DELIVERED" && !deliveredWithin48Hours && (
        <Alert severity="warning">Return & Refund and Exchange are available only within 48 hours after delivery.</Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button fullWidth variant="outlined" onClick={() => navigate("/account/orders")} sx={{ borderRadius: "12px", py: 1.5, color: "black", borderColor: "#e5e7eb", "&:hover": { borderColor: "black" }, fontWeight: "bold" }}>
          Back to Orders
        </Button>
        {canCancel && (
          <Button fullWidth variant="contained" color="error" disabled={loading} onClick={() => setCancelDialogOpen(true)} sx={{ borderRadius: "12px", py: 1.5, fontWeight: "black", boxShadow: "none" }}>
            Cancel Order
          </Button>
        )}
      </div>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}>
        <DialogTitle className="font-black text-2xl">Cancel Order</DialogTitle>
        <DialogContent className="space-y-4">
          <p className="text-gray-500 text-sm">Please let us know why you are cancelling your order. This helps us improve our service.</p>
          <FormControl fullWidth margin="normal">
            <InputLabel id="cancel-reason-label">Select Reason</InputLabel>
            <Select labelId="cancel-reason-label" value={selectedCancelReason} label="Select Reason" onChange={(event) => setSelectedCancelReason(String(event.target.value))} sx={{ borderRadius: "12px" }}>
              {cancelReasonOptions.map((reason) => (
                <MenuItem key={reason.code} value={reason.code}>{reason.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth multiline minRows={3} label="Additional comments" placeholder="Tell us more..." value={cancelReasonText} onChange={(event) => setCancelReasonText(event.target.value)} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCancelDialogOpen(false)} sx={{ fontWeight: "bold", color: "gray" }}>Stay with Order</Button>
          <Button color="error" variant="contained" disabled={!selectedCancelReason || loading} onClick={handleCancelOrder} sx={{ borderRadius: "10px", px: 4, fontWeight: "bold", boxShadow: "none" }}>
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={differenceDialogOpen} onClose={exchangeActionLoading ? undefined : () => setDifferenceDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Difference Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning">Please submit the payment reference after collecting the extra amount from the customer.</Alert>
            <TextField label="Payment reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDifferenceDialogOpen(false)} disabled={exchangeActionLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleDifferencePayment} disabled={exchangeActionLoading || !paymentReference.trim()}>Submit</Button>
        </DialogActions>
      </Dialog>

      <ReturnRefundForm open={returnRefundOpen} loading={returnRefundSubmitting} error={returnRefundError} orderItemTitle={item?.product?.title} onClose={() => setReturnRefundOpen(false)} onSubmit={handleSubmitReturnRefund} />
      <ExchangeRequestForm open={exchangeFormOpen} loading={exchangeActionLoading} error={exchangeError} orderItemTitle={item?.product?.title} productOptions={productOptions.length ? productOptions : [{ id: item?.product?.id || 0, title: item?.product?.title || "Current Product" }]} onClose={() => setExchangeFormOpen(false)} onSubmit={handleCreateExchange} />
      <BalanceSelectionForm open={balanceFormOpen} loading={exchangeActionLoading} onClose={() => setBalanceFormOpen(false)} onSubmit={handleBalanceMode} />
      <BankDetailsForm open={bankFormOpen} loading={exchangeActionLoading} initial={latestExchangeRequest?.bankDetails || latestExchangeRequest?.balanceHandling?.bankDetails || null} onClose={() => setBankFormOpen(false)} onSubmit={handleBankDetails} />
    </div>
  );
};

export default OrderDetails;
