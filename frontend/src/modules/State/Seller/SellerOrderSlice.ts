import { createSlice } from "@reduxjs/toolkit";
import {
  fetchSellerOrders,
  updateSellerOrderStatus,
  SellerOrder,
} from "./sellerOrderThunks";

interface SellerOrderState {
  orders: SellerOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: SellerOrderState = {
  orders: [],
  loading: false,
  error: null,
};

const sellerOrderSlice = createSlice({
  name: "sellerOrder",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })

      .addCase(updateSellerOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSellerOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.map((order) =>
          order.id === action.payload.id ? action.payload : order,
        );
      })

      .addMatcher(
        (action) => action.type.startsWith("sellerOrder/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.loading = false;
          state.error = action.payload || "Something went wrong";
        },
      );
  },
});

export default sellerOrderSlice.reducer;
