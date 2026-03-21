import { createSlice } from '@reduxjs/toolkit';
import {
  fetchSellerProducts,
  createProduct,
  updateSellerProduct,
  deleteSellerProduct,
} from './sellerProductThunks';
import { Product } from 'shared/types/product.types';

interface SellerProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: SellerProductState = {
  products: [],
  loading: false,
  error: null,
};

const sellerProductSlice = createSlice({
  name: 'sellerProduct',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })

      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
      })

      .addCase(updateSellerProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSellerProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        );
      })

      .addCase(deleteSellerProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSellerProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(
          (p) => Number(p.id) !== Number(action.payload),
        );
      })

      .addMatcher(
        (action) =>
          action.type.startsWith('sellerProduct/') &&
          action.type.endsWith('/rejected'),
        (state, action: { payload?: unknown }) => {
          state.loading = false;
          state.error =
            typeof action.payload === 'string'
              ? action.payload
              : 'Something went wrong';
        },
      );
  },
});

export default sellerProductSlice.reducer;
