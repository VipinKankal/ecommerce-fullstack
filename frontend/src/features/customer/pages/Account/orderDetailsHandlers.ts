import React from 'react';
import { api } from 'shared/api/Api';
import { AppDispatch } from 'app/store/Store';
import {
  cancelOrder,
  orderById,
  userOrderHistory,
} from 'State/backend/MasterApiThunks';
import {
  createExchangeRequest,
  ExchangeRequestRecord,
  fetchExchangeRequests,
  selectExchangeBalanceMode,
  submitDifferencePayment,
  submitExchangeBankDetails,
} from 'State/features/customer/exchange/slice';
import { OrderItemLite, ReturnRefundRequestLite } from './orderDetailsTypes';

type ReturnRefundPayload = {
  returnReason: string;
  comment?: string;
  productPhoto?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
};

type ExchangePayload = {
  exchangeReason: string;
  comment?: string;
  productPhoto?: string;
  requestedVariant?: string;
  requestedNewProductId: number | string;
};

type BankDetailsPayload = {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
};

type CreateOrderDetailsHandlersParams = {
  dispatch: AppDispatch;
  item: OrderItemLite | null;
  resolvedOrderId?: string;
  selectedCancelReason: string;
  cancelReasonText: string;
  latestExchangeRequest: ExchangeRequestRecord | null;
  paymentReference: string;
  setReturnRefundRequests: React.Dispatch<
    React.SetStateAction<ReturnRefundRequestLite[]>
  >;
  setReturnRefundLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setReturnRefundSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setReturnRefundError: React.Dispatch<React.SetStateAction<string | null>>;
  setReturnRefundOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCancelSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setCancelDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setExchangeFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDifferenceDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPaymentReference: React.Dispatch<React.SetStateAction<string>>;
  setBalanceFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setBankFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
};

export const createOrderDetailsHandlers = ({
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
}: CreateOrderDetailsHandlersParams) => {
  const loadReturnRefundRequests = async () => {
    setReturnRefundLoading(true);
    setReturnRefundError(null);
    try {
      const response = await api.get('/api/orders/returns');
      setReturnRefundRequests(
        Array.isArray(response.data)
          ? (response.data as ReturnRefundRequestLite[])
          : [],
      );
    } catch (error: unknown) {
      setReturnRefundError(
        getErrorMessage(error, 'Failed to load return refund requests'),
      );
    } finally {
      setReturnRefundLoading(false);
    }
  };

  const handleSubmitReturnRefund = async (payload: ReturnRefundPayload) => {
    if (!item?.id) return;
    setReturnRefundSubmitting(true);
    setReturnRefundError(null);
    try {
      await api.post('/api/orders/returns/items/' + item.id, {
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
    } catch (error: unknown) {
      setReturnRefundError(
        getErrorMessage(error, 'Failed to submit return request'),
      );
    } finally {
      setReturnRefundSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!resolvedOrderId || !selectedCancelReason) return;
    try {
      await dispatch(
        cancelOrder({
          orderId: resolvedOrderId,
          cancelReasonCode: selectedCancelReason,
          cancelReasonText: cancelReasonText.trim() || undefined,
        }),
      ).unwrap();
      setCancelSuccess('Order cancelled successfully.');
      setCancelDialogOpen(false);
      dispatch(orderById(resolvedOrderId));
      dispatch(userOrderHistory());
    } catch (cancelError) {
      console.error('Cancellation failed', cancelError);
    }
  };

  const handleCreateExchange = async (payload: ExchangePayload) => {
    if (!item?.id) return;
    await dispatch(
      createExchangeRequest({ orderItemId: item.id, ...payload }),
    ).unwrap();
    setExchangeFormOpen(false);
    dispatch(fetchExchangeRequests());
  };

  const handleDifferencePayment = async () => {
    if (!latestExchangeRequest?.id || !paymentReference.trim()) return;
    await dispatch(
      submitDifferencePayment({
        requestId: latestExchangeRequest.id,
        paymentReference: paymentReference.trim(),
      }),
    ).unwrap();
    setDifferenceDialogOpen(false);
    setPaymentReference('');
    dispatch(fetchExchangeRequests());
  };

  const handleBalanceMode = async (balanceMode: 'WALLET' | 'BANK_TRANSFER') => {
    if (!latestExchangeRequest?.id) return;
    await dispatch(
      selectExchangeBalanceMode({
        requestId: latestExchangeRequest.id,
        balanceMode,
      }),
    ).unwrap();
    setBalanceFormOpen(false);
    dispatch(fetchExchangeRequests());
  };

  const handleBankDetails = async (payload: BankDetailsPayload) => {
    if (
      !latestExchangeRequest?.id ||
      !payload.accountHolderName ||
      !payload.accountNumber ||
      !payload.ifscCode ||
      !payload.bankName
    ) {
      return;
    }
    await dispatch(
      submitExchangeBankDetails({
        requestId: latestExchangeRequest.id,
        accountHolderName: payload.accountHolderName,
        accountNumber: payload.accountNumber,
        ifscCode: payload.ifscCode,
        bankName: payload.bankName,
        upiId: payload.upiId,
      }),
    ).unwrap();
    setBankFormOpen(false);
    dispatch(fetchExchangeRequests());
  };

  return {
    handleBalanceMode,
    handleBankDetails,
    handleCancelOrder,
    handleCreateExchange,
    handleDifferencePayment,
    handleSubmitReturnRefund,
    loadReturnRefundRequests,
  };
};
