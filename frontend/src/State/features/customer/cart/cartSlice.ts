import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Cart } from 'shared/types/cart.types';
import { api } from 'shared/api/Api';
import { applyCoupon } from './applyCoupon';
import { API_ROUTES } from 'shared/api/ApiRoutes';
import {
  getErrorMessage,
  getThunkErrorMessage,
} from 'State/backend/masterApi/shared';

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
  'cart/fetchUserCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.cart.base);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch cart'));
    }
  },
);

interface AddItemToCart {
  productId: number | undefined;
  quantity: number;
  size: string;
}

export const addToCart = createAsyncThunk<Cart, AddItemToCart>(
  'cart/addItemToCart',
  async (request, { rejectWithValue }) => {
    try {
      const response = await api.put(API_ROUTES.cart.add, request);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to add item to cart'),
      );
    }
  },
);

export const updateItem = createAsyncThunk<
  Cart,
  { cartItemId: number; cartItem: Record<string, unknown> }
>(
  'cart/updateCartItem',
  async ({ cartItemId, cartItem }, { rejectWithValue }) => {
    try {
      await api.put(API_ROUTES.cart.item(cartItemId), cartItem);
      const cartResponse = await api.get(API_ROUTES.cart.base);
      return cartResponse.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update cart item'),
      );
    }
  },
);

export const deleteItem = createAsyncThunk<Cart, { cartItemId: number }>(
  'cart/deleteCartItem',
  async ({ cartItemId }, { rejectWithValue }) => {
    try {
      await api.delete(API_ROUTES.cart.item(cartItemId));
      const cartResponse = await api.get(API_ROUTES.cart.base);
      return cartResponse.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to delete item from cart'),
      );
    }
  },
);

const cartSlice = createSlice({
  name: 'cart',
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
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = getThunkErrorMessage(action.payload, 'Failed to apply coupon');
      });
  },
});

export const { resetCartState } = cartSlice.actions;
export default cartSlice.reducer;
