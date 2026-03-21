import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

export type ExchangeBalanceMode = 'WALLET' | 'BANK_TRANSFER';

export type ExchangeHistory = {
  status?: string;
  note?: string;
  createdAt?: string;
};

export type ExchangeRequestRecord = {
  id: number;
  requestNumber?: string;
  oldOrderId?: number;
  oldOrderItemId?: number;
  customerId?: number;
  customerName?: string;
  oldProductId?: number;
  oldProductTitle?: string;
  oldProductImage?: string;
  newProductId?: number;
  newProductTitle?: string;
  newProductImage?: string;
  requestedVariant?: string;
  exchangeReason?: string;
  comment?: string;
  productPhoto?: string;
  status?: string;
  oldPrice?: number;
  newPrice?: number;
  priceDifference?: number;
  courierId?: number;
  courierName?: string;
  adminComment?: string;
  rejectionReason?: string;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
  } | null;
  requestedAt?: string;
  approvedAt?: string;
  pickupScheduledAt?: string;
  oldItemPickedAt?: string;
  pickupCompletedAt?: string;
  paymentCompletedAt?: string;
  walletCreditCompletedAt?: string;
  bankRefundInitiatedAt?: string;
  bankRefundCompletedAt?: string;
  exchangeCompletedAt?: string;
  priceSummary?: {
    oldPrice?: number;
    newPrice?: number;
    priceDifference?: number;
    customerPaymentRequired?: boolean;
    customerRefundRequired?: boolean;
    balanceMode?: ExchangeBalanceMode | null;
  } | null;
  balanceHandling?: {
    status?: string;
    paymentReference?: string;
    walletCreditStatus?: string;
    bankRefundStatus?: string;
    bankDetails?: ExchangeRequestRecord['bankDetails'];
  } | null;
  exchangePickup?: {
    id?: number;
    status?: string;
    exchangeStatus?: string;
    scheduledAt?: string;
    arrivedAt?: string;
    oldItemPickedAt?: string;
    completedAt?: string;
    pickupPhoto?: string;
    note?: string;
  } | null;
  replacementOrder?: {
    id?: number;
    replacementOrderNumber?: string;
    status?: string;
    createdAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
  } | null;
  history?: ExchangeHistory[];
};

export type CreateExchangePayload = {
  orderItemId: number | string;
  exchangeReason: string;
  comment?: string;
  productPhoto?: string;
  requestedVariant?: string;
  requestedNewProductId: number | string;
};

const finalStatuses = new Set(['EXCHANGE_REJECTED', 'EXCHANGE_COMPLETED']);

interface ExchangeState {
  requests: ExchangeRequestRecord[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ExchangeState = {
  requests: [],
  loading: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

const normalizeRequests = (payload: unknown): ExchangeRequestRecord[] => {
  if (Array.isArray(payload)) {
    return payload as ExchangeRequestRecord[];
  }

  if (payload && typeof payload === 'object') {
    const typedPayload = payload as {
      id?: number | string;
      requests?: unknown;
    };
    if (Array.isArray(typedPayload.requests)) {
      return typedPayload.requests as ExchangeRequestRecord[];
    }
    if (typedPayload.id !== undefined) {
      return [typedPayload as ExchangeRequestRecord];
    }
  }

  return [];
};

const mergeRequest = (
  requests: ExchangeRequestRecord[],
  nextRequest: ExchangeRequestRecord,
) => {
  const existingIndex = requests.findIndex(
    (entry) => Number(entry.id) === Number(nextRequest.id),
  );
  if (existingIndex === -1) {
    return [nextRequest, ...requests];
  }
  const updated = [...requests];
  updated[existingIndex] = nextRequest;
  return updated;
};

export const fetchExchangeRequests = createAsyncThunk<
  ExchangeRequestRecord[],
  void,
  { rejectValue: string }
>('exchange/fetchRequests', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(API_ROUTES.orders.exchanges.base);
    return normalizeRequests(response.data);
  } catch (error: unknown) {
    return rejectWithValue(
      getErrorMessage(error, 'Failed to load exchange requests'),
    );
  }
});

export const createExchangeRequest = createAsyncThunk<
  ExchangeRequestRecord,
  CreateExchangePayload,
  { rejectValue: string }
>('exchange/createRequest', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post(
      API_ROUTES.orders.exchanges.byItem(payload.orderItemId),
      payload,
    );
    return response.data as ExchangeRequestRecord;
  } catch (error: unknown) {
    return rejectWithValue(
      getErrorMessage(error, 'Failed to create exchange request'),
    );
  }
});

export const submitDifferencePayment = createAsyncThunk<
  ExchangeRequestRecord,
  { requestId: number | string; paymentReference: string },
  { rejectValue: string }
>(
  'exchange/submitDifferencePayment',
  async ({ requestId, paymentReference }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        API_ROUTES.orders.exchanges.differencePayment(requestId),
        { paymentReference },
      );
      return response.data as ExchangeRequestRecord;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to submit difference payment'),
      );
    }
  },
);

export const selectExchangeBalanceMode = createAsyncThunk<
  ExchangeRequestRecord,
  { requestId: number | string; balanceMode: ExchangeBalanceMode },
  { rejectValue: string }
>(
  'exchange/selectBalanceMode',
  async ({ requestId, balanceMode }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        API_ROUTES.orders.exchanges.balanceMode(requestId),
        { balanceMode },
      );
      return response.data as ExchangeRequestRecord;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to select balance mode'),
      );
    }
  },
);

export const submitExchangeBankDetails = createAsyncThunk<
  ExchangeRequestRecord,
  {
    requestId: number | string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId?: string;
  },
  { rejectValue: string }
>(
  'exchange/submitBankDetails',
  async ({ requestId, ...bankDetails }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        API_ROUTES.orders.exchanges.bankDetails(requestId),
        bankDetails,
      );
      return response.data as ExchangeRequestRecord;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to submit bank details'),
      );
    }
  },
);

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {
    clearExchangeError: (state) => {
      state.error = null;
    },
    clearExchangeSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExchangeRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchExchangeRequests.fulfilled,
        (state, action: PayloadAction<ExchangeRequestRecord[]>) => {
          state.loading = false;
          state.requests = action.payload;
        },
      )
      .addCase(fetchExchangeRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load exchange requests';
      });

    [
      createExchangeRequest,
      submitDifferencePayment,
      selectExchangeBalanceMode,
      submitExchangeBankDetails,
    ].forEach((thunk) => {
      builder.addCase(thunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      });
      builder.addCase(
        thunk.fulfilled,
        (state, action: PayloadAction<ExchangeRequestRecord>) => {
          state.actionLoading = false;
          state.requests = mergeRequest(state.requests, action.payload);
          const status = (
            action.payload.status || 'EXCHANGE_UPDATED'
          ).replaceAll('_', ' ');
          state.successMessage = `${status} successfully.`;
        },
      );
      builder.addCase(thunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to update exchange request';
      });
    });
  },
});

export const selectLatestExchangeForItem = (
  requests: ExchangeRequestRecord[],
  orderItemId?: number | string | null,
) => {
  const filtered = requests
    .filter(
      (entry) => String(entry.oldOrderItemId) === String(orderItemId || ''),
    )
    .sort(
      (left, right) =>
        new Date(right.requestedAt || 0).getTime() -
        new Date(left.requestedAt || 0).getTime(),
    );
  return filtered[0] || null;
};

export const hasActiveExchange = (request?: ExchangeRequestRecord | null) => {
  if (!request?.status) return false;
  return !finalStatuses.has(String(request.status).toUpperCase());
};

export const { clearExchangeError, clearExchangeSuccess } =
  exchangeSlice.actions;
export default exchangeSlice.reducer;
