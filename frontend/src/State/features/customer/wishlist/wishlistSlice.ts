import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from 'shared/api/Api';
import { API_ROUTES } from 'shared/api/ApiRoutes';

type WishlistItem = Record<string, unknown>;

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const readErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ||
  (error as { message?: string })?.message ||
  fallback;

const extractProducts = (payload: unknown): WishlistItem[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const safePayload = payload as { products?: unknown };
  if (Array.isArray(safePayload.products))
    return safePayload.products as WishlistItem[];
  return [];
};

export const fetchWishlist = createAsyncThunk<unknown, void>(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ROUTES.wishlist.base);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Failed to load wishlist'),
      );
    }
  },
);

export const toggleWishlistProduct = createAsyncThunk<unknown, number | string>(
  'wishlist/toggleWishlistProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.post(
        API_ROUTES.wishlist.addProduct(productId),
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Failed to update wishlist'),
      );
    }
  },
);

export const removeWishlistProduct = createAsyncThunk<unknown, number | string>(
  'wishlist/removeWishlistProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        API_ROUTES.wishlist.removeProduct(productId),
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        readErrorMessage(error, 'Failed to remove product from wishlist'),
      );
    }
  },
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    resetWishlistState: (state) => {
      state.items = [];
      state.loading = false;
      state.actionLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWishlist.fulfilled,
        (state, action: PayloadAction<unknown>) => {
          state.loading = false;
          state.items = extractProducts(action.payload);
        },
      )
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(toggleWishlistProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(
        toggleWishlistProduct.fulfilled,
        (state, action: PayloadAction<unknown>) => {
          state.actionLoading = false;
          state.items = extractProducts(action.payload);
        },
      )
      .addCase(toggleWishlistProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(removeWishlistProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(
        removeWishlistProduct.fulfilled,
        (state, action: PayloadAction<unknown>) => {
          state.actionLoading = false;
          state.items = extractProducts(action.payload);
        },
      )
      .addCase(removeWishlistProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetWishlistState } = wishlistSlice.actions;
export default wishlistSlice.reducer;
