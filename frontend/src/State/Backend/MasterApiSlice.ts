import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { UnknownAction } from 'redux';
import { getThunkErrorMessage } from './masterApi/shared';

interface MasterApiState {
  loading: boolean;
  error: string | null;
  lastAction: string | null;
  responses: Record<string, unknown>;
}

const initialState: MasterApiState = {
  loading: false,
  error: null,
  lastAction: null,
  responses: {},
};

type MasterApiAction = UnknownAction & { payload?: unknown };

const isMasterPending = (action: UnknownAction) =>
  action.type.startsWith('masterApi/') && action.type.endsWith('/pending');
const isMasterFulfilled = (action: UnknownAction) =>
  action.type.startsWith('masterApi/') && action.type.endsWith('/fulfilled');
const isMasterRejected = (action: UnknownAction) =>
  action.type.startsWith('masterApi/') && action.type.endsWith('/rejected');

const getActionKey = (actionType: string) => {
  const withoutPrefix = actionType.startsWith('masterApi/')
    ? actionType.slice('masterApi/'.length)
    : actionType;
  const parts = withoutPrefix.split('/');
  return parts.length > 1 ? parts.slice(0, -1).join('/') : withoutPrefix;
};

const masterApiSlice = createSlice({
  name: 'masterApi',
  initialState,
  reducers: {
    clearMasterApiError: (state) => {
      state.error = null;
    },
    clearMasterApiResponse: (state, action: PayloadAction<string>) => {
      delete state.responses[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(isMasterPending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastAction = getActionKey(action.type);
      })
      .addMatcher(isMasterFulfilled, (state, action: MasterApiAction) => {
        state.loading = false;
        const key = getActionKey(action.type);
        state.lastAction = key;
        state.responses[key] = action.payload;
      })
      .addMatcher(isMasterRejected, (state, action: MasterApiAction) => {
        state.loading = false;
        state.lastAction = getActionKey(action.type);
        state.error = getThunkErrorMessage(action.payload, 'Request failed');
      });
  },
});

export const { clearMasterApiError, clearMasterApiResponse } =
  masterApiSlice.actions;
export default masterApiSlice.reducer;
