import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Cart } from "../Types/cartTypes";
import { api } from "../../Config/Api";
import { applyCoupon } from "./applyCoupon";
import { API_ROUTES } from "../../Config/ApiRoutes";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
};

export const fetchUserCart = createAsyncThunk<Cart, void>(
  "cart/fetchUserCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.cart.base);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch cart",
      );
    }
  },
);

interface AddItemToCart {
  productId: number | undefined;
  quantity: number;
  size: string;
}

export const addToCart = createAsyncThunk<Cart, AddItemToCart>(
  "cart/addItemToCart",
  async (request, { rejectWithValue }) => {
    try {
      const response = await api.put(API_ROUTES.cart.add, request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to add item to cart",
      );
    }
  },
);

export const updateItem = createAsyncThunk<
  Cart,
  { cartItemId: number; cartItem: any }
>("cart/updateCartItem", async ({ cartItemId, cartItem }, { rejectWithValue }) => {
  try {
    await api.put(API_ROUTES.cart.item(cartItemId), cartItem);
    const cartResponse = await api.get(API_ROUTES.cart.base);
    return cartResponse.data;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to update cart item",
    );
  }
});

export const deleteItem = createAsyncThunk<Cart, { cartItemId: number }>(
  "cart/deleteCartItem",
  async ({ cartItemId }, { rejectWithValue }) => {
    try {
      await api.delete(API_ROUTES.cart.item(cartItemId));
      const cartResponse = await api.get(API_ROUTES.cart.base);
      return cartResponse.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete item from cart",
      );
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCartState: (state) => {
      state.cart = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action: PayloadAction<Cart>) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.loading = false;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.loading = false;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      });
  },
});

export const { resetCartState } = cartSlice.actions;
export default cartSlice.reducer;
