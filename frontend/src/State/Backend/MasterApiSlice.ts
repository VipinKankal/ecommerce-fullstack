import { AnyAction, createSlice } from "@reduxjs/toolkit";

interface MasterApiState {
  loading: boolean;
  error: string | null;
  lastAction: string | null;
  responses: Record<string, any>;
}

const initialState: MasterApiState = {
  loading: false,
  error: null,
  lastAction: null,
  responses: {},
};

const isMasterPending = (action: AnyAction) =>
  action.type.startsWith("masterApi/") && action.type.endsWith("/pending");
const isMasterFulfilled = (action: AnyAction) =>
  action.type.startsWith("masterApi/") && action.type.endsWith("/fulfilled");
const isMasterRejected = (action: AnyAction) =>
  action.type.startsWith("masterApi/") && action.type.endsWith("/rejected");

const getActionKey = (actionType: string) =>
  actionType.replace("masterApi/", "").replace(/\/(pending|fulfilled|rejected)$/, "");

const masterApiSlice = createSlice({
  name: "masterApi",
  initialState,
  reducers: {
    clearMasterApiError: (state) => {
      state.error = null;
    },
    clearMasterApiResponse: (state, action: { payload: string }) => {
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
      .addMatcher(isMasterFulfilled, (state, action: AnyAction) => {
        state.loading = false;
        const key = getActionKey(action.type);
        state.lastAction = key;
        state.responses[key] = action.payload;
      })
      .addMatcher(isMasterRejected, (state, action: AnyAction) => {
        state.loading = false;
        state.lastAction = getActionKey(action.type);
        state.error = (action.payload as string) || "Request failed";
      });
  },
});

export const { clearMasterApiError, clearMasterApiResponse } = masterApiSlice.actions;
export default masterApiSlice.reducer;
