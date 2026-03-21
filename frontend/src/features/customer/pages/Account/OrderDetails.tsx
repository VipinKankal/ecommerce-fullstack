import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReturnRefundForm from './components/ReturnRefundForm';
import ExchangeRequestForm from './components/ExchangeRequestForm';
import BalanceSelectionForm from './components/BalanceSelectionForm';
import BankDetailsForm from './components/BankDetailsForm';
import OrderDetailsDialogs from './components/orderDetails/OrderDetailsDialogs';
import OrderDetailsHeaderSection from './components/orderDetails/OrderDetailsHeaderSection';
import OrderDetailsJourneySection from './components/orderDetails/OrderDetailsJourneySection';
import OrderDetailsProductInfo from './components/orderDetails/OrderDetailsProductInfo';
import { createOrderDetailsHandlers } from './orderDetailsHandlers';
import {
  cancelAllowed,
  CancelReasonOption,
  OrderItemLite,
  OrderLite,
  ReturnRefundRequestLite,
  resolveCustomerStatus,
} from './orderDetailsTypes';
import {
  orderById,
  orderCancelReasons,
  orderItemById,
  userOrderHistory,
} from 'State/backend/MasterApiThunks';
import {
  clearExchangeError,
  clearExchangeSuccess,
  fetchExchangeRequests,
  hasActiveExchange,
  selectLatestExchangeForItem,
} from 'State/features/customer/exchange/slice';
import { useAppDispatch, useAppSelector } from 'app/store/Store';
import { buildTrackingMilestones } from 'features/courier/courierData';

const OrderDetails = () => {
  const params = useParams();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, responses } = useAppSelector(
    (state) => state.masterApi,
  );
  const {
    requests: exchangeRequests,
    loading: exchangeLoading,
    actionLoading: exchangeActionLoading,
    error: exchangeError,
    successMessage: exchangeSuccess,
  } = useAppSelector((state) => state.exchange);

  const [returnRefundRequests, setReturnRefundRequests] = useState<
    ReturnRefundRequestLite[]
  >([]);
  const [returnRefundLoading, setReturnRefundLoading] = useState(false);
  const [returnRefundSubmitting, setReturnRefundSubmitting] = useState(false);
  const [returnRefundError, setReturnRefundError] = useState<string | null>(
    null,
  );
  const [returnRefundOpen, setReturnRefundOpen] = useState(false);
  const [exchangeFormOpen, setExchangeFormOpen] = useState(false);
  const [balanceFormOpen, setBalanceFormOpen] = useState(false);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [differenceDialogOpen, setDifferenceDialogOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  const { resolvedOrderId, resolvedOrderItemId } = useMemo(() => {
    const routeParams = params as {
      orderId?: string;
      orderItemId?: string;
      '*': string | undefined;
    };
    const directOrderId = routeParams.orderId;
    const directOrderItemId = routeParams.orderItemId;
    if (directOrderId) {
      return {
        resolvedOrderId: directOrderId,
        resolvedOrderItemId: directOrderItemId,
      };
    }
    const splat = routeParams['*'];
    const source =
      splat && splat.length > 0
        ? splat
        : location.pathname.replace(/^\/account\//, '');
    const parts = source.split('/').filter(Boolean);
    if (parts[0] !== 'orders') {
      return { resolvedOrderId: undefined, resolvedOrderItemId: undefined };
    }
    return { resolvedOrderId: parts[1], resolvedOrderItemId: parts[2] };
  }, [location.pathname, params]);

  const successMessageState = (
    location.state as { successMessage?: string } | null
  )?.successMessage;
  const initialSuccessMessage =
    typeof successMessageState === 'string'
      ? successMessageState || null
      : null;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(
    initialSuccessMessage,
  );

  const order = (responses.orderById || null) as OrderLite | null;
  const selectedItem = (responses.orderItemById ||
    null) as OrderItemLite | null;
  const cancelReasonOptions = useMemo<CancelReasonOption[]>(() => {
    const data = responses.orderCancelReasons as
      | CancelReasonOption[]
      | {
          reasons?: Array<
            string | CancelReasonOption | Record<string, unknown>
          >;
        }
      | Array<string | CancelReasonOption | Record<string, unknown>>
      | null
      | undefined;
    const reasonsFromData =
      data && !Array.isArray(data) && Array.isArray(data.reasons)
        ? data.reasons
        : [];
    const rawList = Array.isArray(data) ? data : reasonsFromData;
    const parsed = rawList
      .map(
        (
          reason: string | CancelReasonOption | Record<string, unknown>,
        ): CancelReasonOption | null => {
          if (typeof reason === 'string')
            return { code: reason, label: reason };
          const typedReason = reason as Record<string, unknown>;
          const code =
            typedReason.code ||
            typedReason.reasonCode ||
            typedReason.value ||
            typedReason.id;
          const label =
            typedReason.label ||
            typedReason.reason ||
            typedReason.title ||
            typedReason.name ||
            code;
          if (!code) return null;
          return { code: String(code), label: String(label || code) };
        },
      )
      .filter(Boolean) as CancelReasonOption[];
    if (parsed.length) return parsed;
    return [
      { code: 'ORDERED_BY_MISTAKE', label: 'Ordered by mistake' },
      { code: 'FOUND_BETTER_PRICE', label: 'Found better price elsewhere' },
      { code: 'DELIVERY_TOO_LATE', label: 'Delivery is taking too long' },
      { code: 'CHANGED_MY_MIND', label: 'Changed my mind' },
      { code: 'OTHER', label: 'Other' },
    ];
  }, [responses.orderCancelReasons]);

  const item = useMemo(() => {
    if (selectedItem) return selectedItem;
    if (!order) return null;
    if (!resolvedOrderItemId) return (order.orderItems || [])[0] || null;
    return (
      (order.orderItems || []).find(
        (entry) => String(entry.id) === String(resolvedOrderItemId),
      ) ||
      (order.orderItems || [])[0] ||
      null
    );
  }, [selectedItem, order, resolvedOrderItemId]);

  const latestExchangeRequest = useMemo(
    () => selectLatestExchangeForItem(exchangeRequests, item?.id),
    [exchangeRequests, item?.id],
  );

  const {
    handleBalanceMode,
    handleBankDetails,
    handleCancelOrder,
    handleCreateExchange,
    handleDifferencePayment,
    handleSubmitReturnRefund,
    loadReturnRefundRequests,
  } = createOrderDetailsHandlers({
    dispatch,
    item,
    resolvedOrderId,
    selectedCancelReason,
    cancelReasonText,
    latestExchangeRequest,
    paymentReference,
    setReturnRefundRequests,
    setReturnRefundLoading,
    setReturnRefundSubmitting,
    setReturnRefundError,
    setReturnRefundOpen,
    setCancelSuccess,
    setCancelDialogOpen,
    setExchangeFormOpen,
    setDifferenceDialogOpen,
    setPaymentReference,
    setBalanceFormOpen,
    setBankFormOpen,
  });

  const loadReturnRefundRequestsRef = useRef(loadReturnRefundRequests);

  useEffect(() => {
    loadReturnRefundRequestsRef.current = loadReturnRefundRequests;
  }, [loadReturnRefundRequests]);

  useEffect(() => {
    if (!resolvedOrderId) return;

    const loadOrder = () => {
      dispatch(orderById(resolvedOrderId));
      dispatch(userOrderHistory());
      dispatch(fetchExchangeRequests());
      loadReturnRefundRequestsRef.current();
      if (resolvedOrderItemId) dispatch(orderItemById(resolvedOrderItemId));
    };

    loadOrder();
    dispatch(orderCancelReasons());

    const intervalId = globalThis.setInterval(loadOrder, 20000);
    const handleFocus = () => loadOrder();
    globalThis.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      globalThis.clearInterval(intervalId);
      globalThis.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [dispatch, resolvedOrderId, resolvedOrderItemId]);

  useEffect(
    () => () => {
      dispatch(clearExchangeError());
      dispatch(clearExchangeSuccess());
    },
    [dispatch],
  );

  const latestReturnRefundRequest = useMemo(
    () =>
      returnRefundRequests
        .filter((entry) => String(entry.orderItemId) === String(item?.id || ''))
        .sort(
          (left, right) =>
            new Date(right.requestedAt || 0).getTime() -
            new Date(left.requestedAt || 0).getTime(),
        )[0] || null,
    [item?.id, returnRefundRequests],
  );

  const hasActiveReturnRefundRequest = latestReturnRefundRequest
    ? !['REFUND_COMPLETED', 'RETURN_REJECTED'].includes(
        (latestReturnRefundRequest.status || '').toUpperCase(),
      )
    : false;

  const rawOrderStatus = (order?.orderStatus || 'PENDING').toUpperCase();
  const shipmentStatus = (
    order?.shipmentStatus || rawOrderStatus
  ).toUpperCase();
  const deliveryTaskStatus = (order?.deliveryTaskStatus || '').toUpperCase();
  const pendingReason = order?.deliveryStatusReason || '';
  const sanitizedPendingReason = /verified|delivered/i.test(pendingReason)
    ? ''
    : pendingReason;
  const customerStatus = resolveCustomerStatus(order);
  const canCancel = cancelAllowed.has(rawOrderStatus);
  const courierName =
    order?.courier?.fullName || order?.courier?.name || order?.courierName;
  const courierPhone = order?.courier?.phone || order?.courierPhone;
  const trackingSteps = buildTrackingMilestones({
    orderStatus: rawOrderStatus,
    fulfillmentStatus: order?.fulfillmentStatus,
    shipmentStatus,
  });
  const showCourierCard =
    [
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'ARRIVED',
      'CONFIRMATION_PENDING',
    ].includes(shipmentStatus) || deliveryTaskStatus === 'CONFIRMATION_PENDING';
  const deliveryDateMs = order?.deliveryDate
    ? new Date(order.deliveryDate).getTime()
    : 0;
  const [pageLoadedAt] = useState(() => Date.now());
  const deliveredWithin48Hours =
    customerStatus === 'DELIVERED' &&
    deliveryDateMs > 0 &&
    pageLoadedAt - deliveryDateMs <= 48 * 60 * 60 * 1000;
  const canRequestReturnRefund =
    deliveredWithin48Hours && !!item?.id && !hasActiveReturnRefundRequest;
  const canRequestExchange =
    deliveredWithin48Hours &&
    !!item?.id &&
    !hasActiveExchange(latestExchangeRequest);
  const productOptions = useMemo(() => {
    const options = new Map<string, { id: number | string; title: string }>();
    if (item?.product?.id) {
      options.set(String(item.product.id), {
        id: item.product.id,
        title: item.product.title || 'Current Product',
      });
    }
    (order?.orderItems || []).forEach((entry) => {
      if (entry.product?.id) {
        options.set(String(entry.product.id), {
          id: entry.product.id,
          title: entry.product.title || `Product ${entry.product.id}`,
        });
      }
    });
    return Array.from(options.values());
  }, [item, order?.orderItems]);
  const exchangeProductOptions = productOptions.length
    ? productOptions
    : [
        {
          id: item?.product?.id || 0,
          title: item?.product?.title || 'Current Product',
        },
      ];

  if (loading && !order) {
    return (
      <div className="py-20 flex justify-center">
        <CircularProgress thickness={2} />
      </div>
    );
  }

  if (error && !order)
    return (
      <Alert severity="error" className="rounded-xl">
        {error}
      </Alert>
    );
  if (!order)
    return (
      <Alert severity="warning" className="rounded-xl">
        Order not found.
      </Alert>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <OrderDetailsHeaderSection
        customerStatus={customerStatus}
        paymentStatus={order.paymentStatus}
        latestExchangeStatus={latestExchangeRequest?.status}
        cancelSuccess={cancelSuccess}
        exchangeSuccess={exchangeSuccess}
        exchangeError={exchangeError}
        onCloseExchangeSuccess={() => dispatch(clearExchangeSuccess())}
        onCloseExchangeError={() => dispatch(clearExchangeError())}
        order={order}
        trackingCompleted={
          trackingSteps.filter((step) => step.completed).length
        }
        trackingTotal={trackingSteps.length}
        returnRefundLoading={returnRefundLoading}
        exchangeLoading={exchangeLoading}
      />

      <OrderDetailsJourneySection
        rawOrderStatus={rawOrderStatus}
        shipmentStatus={shipmentStatus}
        order={order}
        trackingSteps={trackingSteps}
        latestReturnRefundRequest={latestReturnRefundRequest}
        returnRefundError={returnRefundError}
        returnRefundOpen={returnRefundOpen}
        latestExchangeRequest={latestExchangeRequest}
        onPayDifference={() => setDifferenceDialogOpen(true)}
        onSelectBalanceMode={() => setBalanceFormOpen(true)}
        onSubmitBankDetails={() => setBankFormOpen(true)}
        deliveryTaskStatus={deliveryTaskStatus}
        sanitizedPendingReason={sanitizedPendingReason}
        showCourierCard={showCourierCard}
        courierName={courierName}
        courierPhone={courierPhone}
      />

      <OrderDetailsProductInfo
        orderId={order.id}
        customerStatus={customerStatus}
        item={item}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {canRequestReturnRefund && (
          <Button
            fullWidth
            variant="contained"
            onClick={() => setReturnRefundOpen(true)}
            sx={{
              borderRadius: '12px',
              py: 1.5,
              fontWeight: 800,
              boxShadow: 'none',
              bgcolor: '#111827',
              '&:hover': { bgcolor: '#000000' },
            }}
          >
            Return & Refund
          </Button>
        )}
        {canRequestExchange && (
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setExchangeFormOpen(true)}
            sx={{
              borderRadius: '12px',
              py: 1.5,
              fontWeight: 800,
              borderColor: '#d1d5db',
              color: '#111827',
              '&:hover': { borderColor: '#111827', bgcolor: '#f9fafb' },
            }}
          >
            Exchange
          </Button>
        )}
      </Stack>

      {latestReturnRefundRequest &&
        !canRequestReturnRefund &&
        hasActiveReturnRefundRequest && (
          <Alert severity="info">
            Return & Refund request is currently in progress for this item.
          </Alert>
        )}
      {latestExchangeRequest && hasActiveExchange(latestExchangeRequest) && (
        <Alert severity="info">
          Exchange request is currently in progress for this item.
        </Alert>
      )}
      {customerStatus === 'DELIVERED' && !deliveredWithin48Hours && (
        <Alert severity="warning">
          Return & Refund and Exchange are available only within 48 hours after
          delivery.
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button
          fullWidth
          variant="outlined"
          onClick={() => navigate('/account/orders')}
          sx={{
            borderRadius: '12px',
            py: 1.5,
            color: 'black',
            borderColor: '#e5e7eb',
            '&:hover': { borderColor: 'black' },
            fontWeight: 'bold',
          }}
        >
          Back to Orders
        </Button>
        {canCancel && (
          <Button
            fullWidth
            variant="contained"
            color="error"
            disabled={loading}
            onClick={() => setCancelDialogOpen(true)}
            sx={{
              borderRadius: '12px',
              py: 1.5,
              fontWeight: 'black',
              boxShadow: 'none',
            }}
          >
            Cancel Order
          </Button>
        )}
      </div>

      <OrderDetailsDialogs
        cancelDialogOpen={cancelDialogOpen}
        selectedCancelReason={selectedCancelReason}
        cancelReasonText={cancelReasonText}
        cancelReasonOptions={cancelReasonOptions}
        loading={loading}
        onCloseCancel={() => setCancelDialogOpen(false)}
        onCancelReasonChange={setSelectedCancelReason}
        onCancelReasonTextChange={setCancelReasonText}
        onConfirmCancel={handleCancelOrder}
        differenceDialogOpen={differenceDialogOpen}
        exchangeActionLoading={exchangeActionLoading}
        paymentReference={paymentReference}
        onCloseDifference={() => setDifferenceDialogOpen(false)}
        onPaymentReferenceChange={setPaymentReference}
        onSubmitDifference={handleDifferencePayment}
      />

      <ReturnRefundForm
        open={returnRefundOpen}
        loading={returnRefundSubmitting}
        error={returnRefundError}
        orderItemTitle={item?.product?.title}
        onClose={() => setReturnRefundOpen(false)}
        onSubmit={handleSubmitReturnRefund}
      />
      <ExchangeRequestForm
        open={exchangeFormOpen}
        loading={exchangeActionLoading}
        error={exchangeError}
        orderItemTitle={item?.product?.title}
        productOptions={exchangeProductOptions}
        onClose={() => setExchangeFormOpen(false)}
        onSubmit={handleCreateExchange}
      />
      <BalanceSelectionForm
        open={balanceFormOpen}
        loading={exchangeActionLoading}
        onClose={() => setBalanceFormOpen(false)}
        onSubmit={handleBalanceMode}
      />
      <BankDetailsForm
        open={bankFormOpen}
        loading={exchangeActionLoading}
        initial={
          latestExchangeRequest?.bankDetails ||
          latestExchangeRequest?.balanceHandling?.bankDetails ||
          null
        }
        onClose={() => setBankFormOpen(false)}
        onSubmit={handleBankDetails}
      />
    </div>
  );
};

export default OrderDetails;
