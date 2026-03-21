import { createSlice } from '@reduxjs/toolkit';
import {
  fetchProductById,
  searchProducts,
  fetchAllProduct,
} from './productThunks';
import { Product } from 'shared/types/product.types';

type ProductStateItem = Product & {
  ratings?: number;
  [key: string]: unknown;
};

type ProductPagePayload = {
  content?: ProductStateItem[];
  totalPages?: number;
};

const asProductArray = (payload: unknown): ProductStateItem[] =>
  Array.isArray(payload) ? (payload as ProductStateItem[]) : [];

const asProductPagePayload = (payload: unknown): ProductPagePayload | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  return payload as ProductPagePayload;
};

interface ProductState {
  products: ProductStateItem[];
  selectedProduct: ProductStateItem | null;
  searchResult: ProductStateItem[];
  loading: boolean;
  error: string | null;
  totalPages: number;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  searchResult: [],
  loading: false,
  error: null,
  totalPages: 0,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    resetProductDetails: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Products
      .addCase(fetchAllProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProduct.fulfilled, (state, action) => {
        const payload = action.payload as unknown;
        const pagePayload = asProductPagePayload(payload);
        state.loading = false;
        state.products = pagePayload?.content || asProductArray(payload);
        state.totalPages = pagePayload?.totalPages || 0;
      })
      // Fetch Single Product
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct =
          action.payload && typeof action.payload === 'object'
            ? (action.payload as ProductStateItem)
            : null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Search
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResult = asProductArray(action.payload);
      });
  },
});

export const { resetProductDetails } = productSlice.actions;
export default productSlice.reducer;
