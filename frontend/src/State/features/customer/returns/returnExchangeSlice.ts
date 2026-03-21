import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import { getErrorMessage } from 'State/backend/masterApi/shared';

export type ReturnExchangeType = 'RETURN' | 'EXCHANGE';

export type ReturnExchangeHistory = {
  status?: string;
  note?: string;
  updatedBy?: string;
  updatedAt?: string;
};

export type ReturnExchangeRequestRecord = {
  id: number;
  requestNumber?: string;
  orderId?: number;
  orderItemId?: number;
  customerId?: number;
  customerName?: string;
  sellerId?: number;
  courierId?: number;
  courierName?: string;
  requestType?: string;
  status?: string;
  quantityRequested?: number;
  reasonCode?: string;
  customerComment?: string;
  adminComment?: string;
  rejectionReason?: string;
  replacementOrderId?: number;
  pickupAddress?: string;
  productTitle?: string;
  productImage?: string;
  itemSellingPrice?: number;
  size?: string;
  requestedAt?: string;
  adminReviewedAt?: string;
  pickupScheduledAt?: string;
  pickedAt?: string;
  receivedAt?: string;
  refundInitiatedAt?: string;
  refundCompletedAt?: string;
  replacementCreatedAt?: string;
  replacementShippedAt?: string;
  replacementDeliveredAt?: string;
  completedAt?: string;
  history?: ReturnExchangeHistory[];
};

export type SubmitReturnExchangePayload = {
  orderItemId: number | string;
  requestType: ReturnExchangeType;
  reasonCode: string;
  description?: string;
  imageFile?: File | null;
};

interface ReturnExchangeState {
  requests: ReturnExchangeRequestRecord[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  submitSuccess: string | null;
}

const initialState: ReturnExchangeState = {
  requests: [],
  loading: false,
  actionLoading: false,
  error: null,
  submitSuccess: null,
};

const normalizeRequests = (payload: unknown): ReturnExchangeRequestRecord[] => {
  if (Array.isArray(payload)) {
    return payload as ReturnExchangeRequestRecord[];
  }

  if (payload && typeof payload === 'object') {
    const typedPayload = payload as {
      id?: number | string;
      requests?: unknown;
    };
    if (Array.isArray(typedPayload.requests)) {
      return typedPayload.requests as ReturnExchangeRequestRecord[];
    }
    if (typedPayload.id !== undefined) {
      return [typedPayload as ReturnExchangeRequestRecord];
    }
  }

  return [];
};

export const fetchReturnExchangeRequests = createAsyncThunk<
  ReturnExchangeRequestRecord[],
  void,
  { rejectValue: string }
>('returnExchange/fetchRequests', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(API_ROUTES.orders.returnExchange.base);
    return normalizeRequests(response.data);
  } catch (error: unknown) {
    return rejectWithValue(
      getErrorMessage(error, 'Failed to load return and exchange requests'),
    );
  }
});

export const submitReturnExchangeRequest = createAsyncThunk<
  ReturnExchangeRequestRecord,
  SubmitReturnExchangePayload,
  { rejectValue: string }
>('returnExchange/submitRequest', async (payload, { rejectWithValue }) => {
  try {
    const attachmentName = payload.imageFile?.name?.trim();
    const commentParts = [payload.description?.trim()];
    if (attachmentName) {
      commentParts.push(`Attachment: ${attachmentName}`);
    }

    const response = await api.post(
      API_ROUTES.orders.returnExchange.byItem(payload.orderItemId),
      {
        requestType: payload.requestType,
        quantity: 1,
        reasonCode: payload.reasonCode,
        customerComment: commentParts.filter(Boolean).join('\n\n') || undefined,
        attachmentName,
      },
    );

    return response.data as ReturnExchangeRequestRecord;
  } catch (error: unknown) {
    return rejectWithValue(
      getErrorMessage(
        error,
        `Failed to submit ${payload.requestType.toLowerCase()} request`,
      ),
    );
  }
});

const mergeRequest = (
  requests: ReturnExchangeRequestRecord[],
  nextRequest: ReturnExchangeRequestRecord,
): ReturnExchangeRequestRecord[] => {
  const nextId = Number(nextRequest?.id);
  if (!Number.isFinite(nextId)) {
    return requests;
  }

  const existingIndex = requests.findIndex(
    (entry) => Number(entry.id) === nextId,
  );
  if (existingIndex === -1) {
    return [nextRequest, ...requests];
  }

  const updated = [...requests];
  updated[existingIndex] = nextRequest;
  return updated;
};

const returnExchangeSlice = createSlice({
  name: 'returnExchange',
  initialState,
  reducers: {
    clearReturnExchangeError: (state) => {
      state.error = null;
    },
    clearReturnExchangeSuccess: (state) => {
      state.submitSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturnExchangeRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReturnExchangeRequests.fulfilled,
        (state, action: PayloadAction<ReturnExchangeRequestRecord[]>) => {
          state.loading = false;
          state.requests = action.payload;
        },
      )
      .addCase(fetchReturnExchangeRequests.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || 'Failed to load return and exchange requests';
      })
      .addCase(submitReturnExchangeRequest.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.submitSuccess = null;
      })
      .addCase(
        submitReturnExchangeRequest.fulfilled,
        (state, action: PayloadAction<ReturnExchangeRequestRecord>) => {
          state.actionLoading = false;
          state.requests = mergeRequest(state.requests, action.payload);
          state.submitSuccess = `${(action.payload.requestType || 'Request').replaceAll('_', ' ')} submitted successfully.`;
        },
      )
      .addCase(submitReturnExchangeRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || 'Failed to submit request';
      });
  },
});

export const { clearReturnExchangeError, clearReturnExchangeSuccess } =
  returnExchangeSlice.actions;
export default returnExchangeSlice.reducer;
