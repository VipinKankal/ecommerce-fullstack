import { createSlice } from "@reduxjs/toolkit";
import { fetchProductById, searchProducts, fetchAllProduct } from "./productThunks";

interface ProductState {
  products: any[];
  selectedProduct: any | null;
  searchResult: any[];
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
  name: "products",
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
        state.loading = false;
        state.products = action.payload.content || action.payload;
        state.totalPages = action.payload.totalPages || 0;
      })
      // Fetch Single Product
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Search
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResult = action.payload;
      });
  },
});

export const { resetProductDetails } = productSlice.actions;
export default productSlice.reducer;